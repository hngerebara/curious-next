export function TutorLoading({busy,message}:{busy:boolean;message:string}){
 return <div className={"tutor-status"+(busy?" is-loading":"")} role="status" aria-live="polite" aria-atomic="true">{busy && <span className="tutor-spinner" aria-hidden="true"/>}<span>{message}</span></div>;
}
