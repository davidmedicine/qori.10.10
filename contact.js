const DEFAULT_CONTACT_ENDPOINTS=["/api/contact","/.netlify/functions/send-contact"];
const CONTACT_ENDPOINTS=(Array.isArray(window.CONTACT_ENDPOINTS)?window.CONTACT_ENDPOINTS:[])
  .concat(window.CONTACT_ENDPOINTS && !Array.isArray(window.CONTACT_ENDPOINTS)?[window.CONTACT_ENDPOINTS]:[])
  .filter(Boolean);
const CONTACT_ENDPOINT=window.CONTACT_ENDPOINT || CONTACT_ENDPOINTS[0] || DEFAULT_CONTACT_ENDPOINTS[0];
const ENDPOINTS=[CONTACT_ENDPOINT].concat(CONTACT_ENDPOINTS.slice(1),DEFAULT_CONTACT_ENDPOINTS).filter((value,index,self)=>Boolean(value)&&self.indexOf(value)===index);

document.addEventListener("DOMContentLoaded",()=>{
  const form=document.querySelector("[data-contact-form]");
  const status=document.querySelector("[data-contact-status]");
  if(!form||!status) return;

  const setStatus=(message,type)=>{
    status.textContent=message;
    status.classList.remove("is-success","is-error");
    if(type){
      status.classList.add(type);
    }
  };

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const formData=new FormData(form);
    const name=(formData.get("name")||"").trim();
    const email=(formData.get("email")||"").trim();
    const interest=formData.get("interest")||"";
    const rawMessage=formData.get("message")||"";
    const message=rawMessage.trim();

    if(!name||!email||!message){
      setStatus("Please complete all required fields.","is-error");
      return;
    }

    setStatus("Sending message…");
    form.querySelector("button[type=submit]").disabled=true;

    (async ()=>{
      let lastError=new Error("Unable to reach the contact service.");
      for(const endpoint of ENDPOINTS){
        try{
          const response=await fetch(endpoint,{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body:JSON.stringify({name,email,interest,message})
          });

          if(response.ok){
            form.reset();
            setStatus("Thank you. Your message has been sent.","is-success");
            return;
          }

          if([404,405,501].includes(response.status)){
            lastError=new Error("Contact endpoint not available in this environment.");
            continue;
          }

          const errorBody=await response.json().catch(()=>({}));
          const errorMessage=errorBody.error||response.statusText||"Unable to send message";
          lastError=new Error(errorMessage);
          break;
        }catch(err){
          lastError=err;
        }
      }
      console.error(lastError);
      setStatus(lastError.message||"We could not send your message. Please email bentley.dave@gmail.com directly.","is-error");
    })().finally(()=>{
      form.querySelector("button[type=submit]").disabled=false;
    });
  });
});
