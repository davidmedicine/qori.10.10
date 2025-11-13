const CONTACT_ENDPOINT="/api/contact";

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

    try{
      const response=await fetch(CONTACT_ENDPOINT,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({name,email,interest,message})
      });

      if(!response.ok){
        const errorBody=await response.json().catch(()=>({}));
        const errorMessage=errorBody.error||"Unable to send message";
        throw new Error(errorMessage);
      }

      form.reset();
      setStatus("Thank you. Your message has been sent.","is-success");
    }catch(error){
      console.error(error);
      setStatus(error.message||"We could not send your message. Please email bentley.dave@gmail.com directly.","is-error");
    }finally{
      form.querySelector("button[type=submit]").disabled=false;
    }
  });
});
