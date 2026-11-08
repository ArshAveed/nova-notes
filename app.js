const $ = id => document.getElementById(id);
const STORAGE_KEY = "nova-notes-v1";
let notes = loadNotes();
let currentId = null;
let saveTimer = null;
let installPrompt = null;

function loadNotes(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return []}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(notes))}
function uid(){return (crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random())}
function now(){return new Date().toLocaleString("fa-IR",{dateStyle:"medium",timeStyle:"short"})}
function current(){return notes.find(n=>n.id===currentId)}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1700)}
function setStatus(msg){$("status").textContent=msg}
function saveCurrent(){
  const n=current();if(!n)return;
  n.title=$("noteTitle").value.trim();n.content=$("noteContent").value;n.updated=Date.now();
  persist();renderList();setStatus("● ذخیره شد");
}
function scheduleSave(){setStatus("● در حال نوشتن...");clearTimeout(saveTimer);saveTimer=setTimeout(saveCurrent,450)}
function createNote(){
  if(current())saveCurrent();
  const n={id:uid(),title:"",content:"",created:now(),updated:Date.now(),pinned:false};
  notes.unshift(n);persist();openNote(n.id);$("noteTitle").focus();toast("یادداشت جدید ساخته شد");
}
function openNote(id){
  if(current())saveCurrent();
  currentId=id;const n=current();if(!n)return;
  $("noteTitle").disabled=false;$("noteContent").disabled=false;
  $("pinBtn").disabled=false;$("deleteBtn").disabled=false;
  $("noteTitle").value=n.title;$("noteContent").value=n.content;
  $("dateLabel").textContent="ایجاد شده: "+n.created;
  $("pinBtn").textContent=n.pinned?"★ سنجاق‌شده":"☆ سنجاق";
  setStatus("● آماده");renderList();
}
function renderList(){
  const q=$("search").value.trim().toLocaleLowerCase("fa");
  const list=notes.filter(n=>(n.title+" "+n.content).toLocaleLowerCase("fa").includes(q))
    .sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||b.updated-a.updated);
  $("noteList").innerHTML="";
  list.forEach((n,i)=>{
    const b=document.createElement("button");b.className="note-item"+(n.id===currentId?" active":"");
    b.style.animationDelay=(i*25)+"ms";
    b.textContent=(n.pinned?"★ ":"")+(n.title||"یادداشت بدون عنوان");
    b.addEventListener("click",()=>openNote(n.id));$("noteList").appendChild(b);
  });
  $("noteCount").textContent=notes.length.toLocaleString("fa-IR")+" یادداشت";
}
function deleteNote(){
  if(!current())return;
  if(!confirm("این یادداشت حذف شود؟"))return;
  notes=notes.filter(n=>n.id!==currentId);currentId=null;persist();
  if(notes.length)openNote(notes[0].id);else createNote();
  toast("یادداشت حذف شد");
}
function togglePin(){
  const n=current();if(!n)return;n.pinned=!n.pinned;n.updated=Date.now();persist();
  $("pinBtn").textContent=n.pinned?"★ سنجاق‌شده":"☆ سنجاق";renderList();toast(n.pinned?"یادداشت سنجاق شد":"سنجاق برداشته شد");
}
$("newBtn").addEventListener("click",createNote);
$("search").addEventListener("input",renderList);
$("noteTitle").addEventListener("input",scheduleSave);
$("noteContent").addEventListener("input",scheduleSave);
$("pinBtn").addEventListener("click",togglePin);
$("deleteBtn").addEventListener("click",deleteNote);
window.addEventListener("beforeunload",()=>{clearTimeout(saveTimer);saveCurrent()});
if(notes.length)openNote(notes[0].id);else createNote();
renderList();

if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();installPrompt=e;$("installBtn").hidden=false;
});
$("installBtn").addEventListener("click",async()=>{
  if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;
  installPrompt=null;$("installBtn").hidden=true;
});
