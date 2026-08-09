const form = document.getElementById("quoteForm");
form.addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("formMsg");
  msg.textContent = "Đang gửi yêu cầu...";
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const r = await fetch("/api/quotes", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)});
    const j = await r.json();
    if (!r.ok) throw new Error(j.error);
    msg.className = "form-msg success";
    msg.textContent = `Đã gửi yêu cầu thành công. Mã yêu cầu #${j.id}. Đức Hải sẽ liên hệ lại sớm!`;
    form.reset();
  } catch(err) { msg.className="form-msg error"; msg.textContent=err.message; }
});