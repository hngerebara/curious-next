// Native macOS renderer. Run with the artifact directory as the sole argument.
import Foundation
import AppKit
import AVFoundation
import CoreVideo

struct Scene: Decodable { let image: String; let caption: String; let narration: String }
let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let scenes = try JSONDecoder().decode([Scene].self, from: Data(contentsOf: root.appendingPathComponent("demo-scenes.json")))
let temp = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
try FileManager.default.createDirectory(at: temp, withIntermediateDirectories: true)
let composition = AVMutableComposition()
let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
let audioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
var cursor = CMTime.zero
for (index, scene) in scenes.enumerated() {
    let speech = temp.appendingPathComponent("voice-\(index).aiff")
    let text = temp.appendingPathComponent("voice-\(index).txt")
    try scene.narration.write(to: text, atomically: true, encoding: .utf8)
    let say = Process()
    say.executableURL = URL(fileURLWithPath: "/usr/bin/say")
    say.arguments = ["-v", "Daniel", "-r", "155", "-f", text.path, "-o", speech.path]
    try say.run(); say.waitUntilExit()
    guard say.terminationStatus == 0 else { fatalError("Speech generation failed") }
    let audio = AVURLAsset(url: speech)
    let speechDuration = try await audio.load(.duration)
    let frames = Int(ceil(CMTimeGetSeconds(speechDuration) * 12)) + 18
    let duration = CMTime(value: Int64(frames), timescale: 12)
    let movie = temp.appendingPathComponent("scene-\(index).mp4")
    let writer = try AVAssetWriter(outputURL: movie, fileType: .mp4)
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: 1280, AVVideoHeightKey: 720, AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 2000000]])
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB, kCVPixelBufferWidthKey as String: 1280, kCVPixelBufferHeightKey as String: 720])
    writer.add(input)
    guard writer.startWriting() else { throw writer.error! }
    writer.startSession(atSourceTime: .zero)
    var buffer: CVPixelBuffer?
    CVPixelBufferCreate(kCFAllocatorDefault, 1280, 720, kCVPixelFormatType_32ARGB, [kCVPixelBufferCGImageCompatibilityKey: true, kCVPixelBufferCGBitmapContextCompatibilityKey: true] as CFDictionary, &buffer)
    let pixels = buffer!
    CVPixelBufferLockBaseAddress(pixels, [])
    let context = CGContext(data: CVPixelBufferGetBaseAddress(pixels), width: 1280, height: 720, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixels), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
    context.setFillColor(CGColor(red: 0.953, green: 0.937, blue: 0.89, alpha: 1)); context.fill(CGRect(x: 0, y: 0, width: 1280, height: 720))
    let source = NSImage(contentsOf: root.appendingPathComponent(scene.image))!
    let cg = source.cgImage(forProposedRect: nil, context: nil, hints: nil)!
    let scale = min(1280 / CGFloat(cg.width), 650 / CGFloat(cg.height))
    let w = CGFloat(cg.width) * scale; let h = CGFloat(cg.height) * scale
    context.draw(cg, in: CGRect(x: (1280-w)/2, y: 70+(650-h)/2, width: w, height: h))
    context.setFillColor(CGColor(red: 0.13, green: 0.14, blue: 0.12, alpha: 1)); context.fill(CGRect(x: 0, y: 0, width: 1280, height: 70))
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
    (scene.caption as NSString).draw(in: NSRect(x: 28, y: 26, width: 800, height: 28), withAttributes: [.font: NSFont.systemFont(ofSize: 22, weight: .semibold), .foregroundColor: NSColor.white])
    ("Captured-screen walkthrough" as NSString).draw(in: NSRect(x: 870, y: 28, width: 390, height: 24), withAttributes: [.font: NSFont.systemFont(ofSize: 17), .foregroundColor: NSColor(red: 0.82, green: 0.94, blue: 0.4, alpha: 1)])
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
    let voice = try await audio.loadTracks(withMediaType: .audio)[0]
    try audioTrack.insertTimeRange(CMTimeRange(start: .zero, duration: speechDuration), of: voice, at: cursor)
    cursor = CMTimeAdd(cursor, duration)
}
let destination = root.appendingPathComponent("demo-walkthrough.mp4")
guard !FileManager.default.fileExists(atPath: destination.path) else { fatalError("Refusing to overwrite a movie") }
let export = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality)!
export.shouldOptimizeForNetworkUse = true
try await export.export(to: destination, as: .mp4)
let verified = AVURLAsset(url: destination)
let tracks = try await verified.loadTracks(withMediaType: .audio)
guard tracks.count == 1 else { fatalError("Missing narration") }
print("Rendered narrated MP4: \(CMTimeGetSeconds(try await verified.load(.duration))) seconds")
