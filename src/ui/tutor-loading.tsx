export function TutorLoading({busy,message}:{busy:boolean;message:string}){
 if(!busy && !message)return null;
 return <div className={"tutor-status"+(busy?" is-loading":"")} role="status" aria-live="polite" aria-atomic="true">{busy && <span className="tutor-spinner" aria-hidden="true"/>}<span>{message}</span></div>;
}
