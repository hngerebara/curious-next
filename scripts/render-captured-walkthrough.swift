// Native macOS renderer. Run with the artifact directory as the sole argument.
import Foundation
import AppKit
import AVFoundation
import CoreVideo

struct Scene: Decodable { let image: String; let caption: String; let narration: String; let seconds: Double? }
let silent = CommandLine.arguments.contains("--silent")
let frameWidth = silent ? 1920 : 1280
let frameHeight = silent ? 1080 : 720
let bandHeight = silent ? 80 : 70
let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let scenes = try JSONDecoder().decode([Scene].self, from: Data(contentsOf: root.appendingPathComponent("demo-scenes.json")))
let temp = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
try FileManager.default.createDirectory(at: temp, withIntermediateDirectories: true)
let composition = AVMutableComposition()
let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
let audioTrack = silent ? nil : composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)
var cursor = CMTime.zero
for (index, scene) in scenes.enumerated() {
    let speech = temp.appendingPathComponent("voice-\(index).aiff")
    let text = temp.appendingPathComponent("voice-\(index).txt")
    try scene.narration.write(to: text, atomically: true, encoding: .utf8)
    var audio: AVURLAsset?
    var speechDuration = CMTime.zero
    if !silent {
        let say = Process()
        say.executableURL = URL(fileURLWithPath: "/usr/bin/say")
        say.arguments = ["-v", "Daniel", "-r", "155", "-f", text.path, "-o", speech.path]
        try say.run(); say.waitUntilExit()
        guard say.terminationStatus == 0 else { fatalError("Speech generation failed") }
        audio = AVURLAsset(url: speech)
        speechDuration = try await audio!.load(.duration)
    }
    let frames = Int(ceil((silent ? (scene.seconds ?? 6) : CMTimeGetSeconds(speechDuration)) * 12)) + 18
    let duration = CMTime(value: Int64(frames), timescale: 12)
    let movie = temp.appendingPathComponent("scene-\(index).mp4")
    let writer = try AVAssetWriter(outputURL: movie, fileType: .mp4)
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: frameWidth, AVVideoHeightKey: frameHeight, AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 2000000]])
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB, kCVPixelBufferWidthKey as String: frameWidth, kCVPixelBufferHeightKey as String: frameHeight])
    writer.add(input)
    guard writer.startWriting() else { throw writer.error! }
    writer.startSession(atSourceTime: .zero)
    var buffer: CVPixelBuffer?
    CVPixelBufferCreate(kCFAllocatorDefault, frameWidth, frameHeight, kCVPixelFormatType_32ARGB, [kCVPixelBufferCGImageCompatibilityKey: true, kCVPixelBufferCGBitmapContextCompatibilityKey: true] as CFDictionary, &buffer)
    let pixels = buffer!
    CVPixelBufferLockBaseAddress(pixels, [])
    let context = CGContext(data: CVPixelBufferGetBaseAddress(pixels), width: frameWidth, height: frameHeight, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixels), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
    context.setFillColor(CGColor(red: 0.953, green: 0.937, blue: 0.89, alpha: 1)); context.fill(CGRect(x: 0, y: 0, width: frameWidth, height: frameHeight))
    let source = NSImage(contentsOf: root.appendingPathComponent(scene.image))!
    let original = source.cgImage(forProposedRect: nil, context: nil, hints: nil)!
    let cg = silent && original.height > 1000 ? original.cropping(to: CGRect(x: 0, y: 0, width: original.width, height: 1000))! : original
    let scale = min(CGFloat(frameWidth) / CGFloat(cg.width), CGFloat(frameHeight-bandHeight) / CGFloat(cg.height))
    let w = CGFloat(cg.width) * scale; let h = CGFloat(cg.height) * scale
    context.draw(cg, in: CGRect(x: (CGFloat(frameWidth)-w)/2, y: CGFloat(bandHeight)+(CGFloat(frameHeight-bandHeight)-h)/2, width: w, height: h))
    context.setFillColor(CGColor(red: 0.13, green: 0.14, blue: 0.12, alpha: 1)); context.fill(CGRect(x: 0, y: 0, width: frameWidth, height: bandHeight))
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
    (scene.caption as NSString).draw(in: NSRect(x: 28, y: 26, width: CGFloat(frameWidth)*0.65, height: 42), withAttributes: [.font: NSFont.systemFont(ofSize: silent ? 32 : 22, weight: .semibold), .foregroundColor: NSColor.white])
    ("Captured-screen walkthrough" as NSString).draw(in: NSRect(x: CGFloat(frameWidth)*0.7, y: 28, width: CGFloat(frameWidth)*0.29, height: 40), withAttributes: [.font: NSFont.systemFont(ofSize: silent ? 24 : 17), .foregroundColor: NSColor(red: 0.82, green: 0.94, blue: 0.4, alpha: 1)])
    NSGraphicsContext.restoreGraphicsState()
    CVPixelBufferUnlockBaseAddress(pixels, [])
    for frame in 0..<frames {
        while !input.isReadyForMoreMediaData { try await Task.sleep(for: .milliseconds(5)) }
        guard adaptor.append(pixels, withPresentationTime: CMTime(value: Int64(frame), timescale: 12)) else { throw writer.error! }
    }
    input.markAsFinished(); await writer.finishWriting()
    guard writer.status == .completed else { throw writer.error! }
    let video = AVURLAsset(url: movie)
    let track = try await video.loadTracks(withMediaType: .video)[0]
    try videoTrack.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: track, at: cursor)
    if let audio {
        let voice = try await audio.loadTracks(withMediaType: .audio)[0]
        try audioTrack!.insertTimeRange(CMTimeRange(start: .zero, duration: speechDuration), of: voice, at: cursor)
    }
    cursor = CMTimeAdd(cursor, duration)
}
let destination = root.appendingPathComponent(silent ? "demo-captioned.mp4" : "demo-walkthrough.mp4")
guard !FileManager.default.fileExists(atPath: destination.path) else { fatalError("Refusing to overwrite a movie") }
let export = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality)!
export.shouldOptimizeForNetworkUse = true
try await export.export(to: destination, as: .mp4)
let verified = AVURLAsset(url: destination)
let tracks = try await verified.loadTracks(withMediaType: .audio)
guard tracks.count == (silent ? 0 : 1) else { fatalError("Missing narration") }
print("Rendered \(silent ? "captioned" : "narrated") MP4: \(CMTimeGetSeconds(try await verified.load(.duration))) seconds")
