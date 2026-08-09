const $=s=>document.querySelector(s);
const login=$("#login"), dash=$("#dashboard"), rows=$("#rows"), modal=$("#modal");
async function me(){const r=await fetch("/api/admin/me"); const j=await r.json(); if(j.authenticated) showDash(); else showLogin();}
function showLogin(){login.hidden=false;dash.hidden=true}
function showDash(){login.hidden=true;dash.hidden=false;load();}
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault(); const f=new FormData(e.target); const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(f))}); const j=await r.json(); if(r.ok) showDash(); else $("#loginMsg").textContent=j.error;});
$("#logout").onclick=async()=>{await fetch("/api/admin/logout",{method:"POST"});showLogin()};
$("#refresh").onclick=load; $("#search").oninput=load; $("#status").onchange=load;
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function badge(s){return `<span class="status ${s==='Mới'?'new':s==='Đã liên hệ'?'contact':s==='Đã báo giá'?'quoted':'done'}">${esc(s)}</span>`}
async function load(){
 const p=new URLSearchParams({q:$("#search").value,status:$("#status").value});
 const r=await fetch("/api/admin/quotes?"+p); if(r.status===401)return showLogin(); const data=await r.json();
 $("#sAll").textContent=data.length; $("#sNew").textContent=data.filter(x=>x.status==="Mới").length; $("#sContact").textContent=data.filter(x=>x.status==="Đã liên hệ").length; $("#sQuoted").textContent=data.filter(x=>x.status==="Đã báo giá").length; $("#sDone").textContent=data.filter(x=>x.status==="Hoàn tất").length;
 rows.innerHTML=data.map(x=>`<tr><td>#${x.id}</td><td><b>${esc(x.customer_name)}</b></td><td><a href="tel:${esc(x.phone)}">${esc(x.phone)}</a></td><td>${esc(x.cargo)}<small>${esc(x.quantity)}</small></td><td>${esc(x.from_location)} → ${esc(x.to_location)}</td><td>${esc(x.created_at)}</td><td>${badge(x.status)}</td><td><button class="view" onclick="view(${x.id})">Xem</button></td></tr>`).join("") || `<tr><td colspan="8" class="empty">Chưa có yêu cầu.</td></tr>`;
}
window.view=async id=>{const r=await fetch("/api/admin/quotes/"+id); const x=await r.json(); $("#detail").innerHTML=`<h2>Yêu cầu #${x.id}</h2><div class="detail-grid"><p><b>Khách hàng</b>${esc(x.customer_name)}</p><p><b>Số điện thoại</b><a href="tel:${esc(x.phone)}">${esc(x.phone)}</a></p><p><b>Hàng hóa</b>${esc(x.cargo)}</p><p><b>Số lượng</b>${esc(x.quantity)||"—"}</p><p><b>Điểm đi</b>${esc(x.from_location)}</p><p><b>Điểm đến</b>${esc(x.to_location)}</p><p><b>Ngày dự kiến</b>${esc(x.pickup_date)||"—"}</p><p><b>Thời gian gửi</b>${esc(x.created_at)}</p></div><p><b>Ghi chú</b><br>${esc(x.note)||"—"}</p><label><b>Trạng thái</b><select id="detailStatus"><option ${x.status==="Mới"?"selected":""}>Mới</option><option ${x.status==="Đã liên hệ"?"selected":""}>Đã liên hệ</option><option ${x.status==="Đã báo giá"?"selected":""}>Đã báo giá</option><option ${x.status==="Hoàn tất"?"selected":""}>Hoàn tất</option></select></label><div class="modal-actions"><button class="btn" onclick="updateStatus(${x.id})">Lưu trạng thái</button><button class="danger" onclick="removeQuote(${x.id})">Xóa yêu cầu</button></div>`;modal.hidden=false};
window.updateStatus=async id=>{await fetch("/api/admin/quotes/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:$("#detailStatus").value})});modal.hidden=true;load()};
window.removeQuote=async id=>{if(!confirm("Xóa yêu cầu này?"))return; await fetch("/api/admin/quotes/"+id,{method:"DELETE"});modal.hidden=true;load()};
$("#close").onclick=()=>modal.hidden=true; modal.onclick=e=>{if(e.target===modal)modal.hidden=true}; me();