const $ = id => document.getElementById(id);
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
let products = load('sms_products', []);
let sales = load('sms_sales', []);
let bill = [];

function save(){localStorage.setItem('sms_products',JSON.stringify(products));localStorage.setItem('sms_sales',JSON.stringify(sales));}
function money(n){return '₹'+Number(n).toFixed(2)}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function render(){
  $('productCount').textContent=products.length;
  $('stockCount').textContent=products.reduce((a,p)=>a+p.qty,0);
  const today=new Date().toDateString();
  $('todaySales').textContent=money(sales.filter(s=>new Date(s.date).toDateString()===today).reduce((a,s)=>a+s.total,0));
  const low=products.filter(p=>p.qty<=p.reorder);
  $('lowCount').textContent=low.length;
  $('dashboardLow').innerHTML=low.length?low.map(p=>`<p>${escapeHTML(p.name)} — ${p.qty} left</p>`).join(''):'No low-stock products.';
  $('productRows').innerHTML=products.map(p=>`<tr><td>${p.code}</td><td>${escapeHTML(p.name)}</td><td>${escapeHTML(p.category)}</td><td>${money(p.price)}</td><td>${p.qty}</td><td><button class="danger" onclick="deleteProduct('${p.code}')">Delete</button></td></tr>`).join('')||'<tr><td colspan="6">No products added yet.</td></tr>';
  $('billProduct').innerHTML='<option value="">Select product</option>'+products.map(p=>`<option value="${p.code}">${escapeHTML(p.name)} — ${money(p.price)} (Stock: ${p.qty})</option>`).join('');
  $('inventoryRows').innerHTML=products.map(p=>`<tr><td>${escapeHTML(p.name)}</td><td>${p.qty}</td><td>${p.reorder}</td><td class="${p.qty<=p.reorder?'low':'ok'}">${p.qty<=p.reorder?'Low stock':'Available'}</td><td><button class="primary" onclick="addStock('${p.code}')">Add stock</button></td></tr>`).join('')||'<tr><td colspan="5">No inventory records.</td></tr>';
  $('salesRows').innerHTML=sales.slice().reverse().map(s=>`<tr><td>${s.receipt}</td><td>${new Date(s.date).toLocaleString()}</td><td>${s.items.reduce((a,i)=>a+i.qty,0)}</td><td>${money(s.total)}</td></tr>`).join('')||'<tr><td colspan="4">No completed sales.</td></tr>';
  renderBill();
}
function renderBill(){
  $('billRows').innerHTML=bill.map((i,n)=>`<tr><td>${escapeHTML(i.name)}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(i.qty*i.price)}</td><td><button class="danger" onclick="removeBillItem(${n})">Remove</button></td></tr>`).join('')||'<tr><td colspan="5">No items in the bill.</td></tr>';
  $('billTotal').textContent=money(bill.reduce((a,i)=>a+i.qty*i.price,0));
}
$('productForm').addEventListener('submit',e=>{
 e.preventDefault();const name=$('pName').value.trim(),category=$('pCategory').value.trim(),price=Number($('pPrice').value),qty=Number($('pQty').value),reorder=Number($('pReorder').value);
 if(!name||!category||price<=0||qty<0||reorder<0)return alert('Enter valid product details.');
 products.push({code:'P'+Date.now().toString().slice(-7),name,category,price,qty,reorder});save();e.target.reset();$('pReorder').value=5;render();
});
function deleteProduct(code){if(bill.some(i=>i.code===code))return alert('Remove this product from the current bill first.');if(confirm('Delete this product?')){products=products.filter(p=>p.code!==code);save();render();}}
$('addToBill').addEventListener('click',()=>{
 const code=$('billProduct').value,qty=Number($('billQty').value),p=products.find(x=>x.code===code);
 if(!p||!Number.isInteger(qty)||qty<1)return alert('Select a product and enter a valid quantity.');
 const existing=bill.find(i=>i.code===code),requested=qty+(existing?.qty||0);
 if(requested>p.qty)return alert('Insufficient stock. Available: '+p.qty);
 if(existing)existing.qty+=qty;else bill.push({code,name:p.name,price:p.price,qty});
 renderBill();
});
function removeBillItem(index){bill.splice(index,1);renderBill();}
$('clearBill').addEventListener('click',()=>{bill=[];renderBill();});
$('completeSale').addEventListener('click',()=>{
 if(!bill.length)return alert('Add at least one product to the bill.');
 for(const item of bill){const p=products.find(x=>x.code===item.code);if(!p||p.qty<item.qty)return alert('Stock changed. Please review the bill.');}
 const total=bill.reduce((a,i)=>a+i.qty*i.price,0);
 bill.forEach(i=>products.find(p=>p.code===i.code).qty-=i.qty);
 sales.push({receipt:'R'+Date.now(),date:new Date().toISOString(),items:bill.map(i=>({...i})),total});
 bill=[];save();render();alert('Sale completed successfully. Stock has been updated.');
});
function addStock(code){const p=products.find(x=>x.code===code);const n=Number(prompt('Enter quantity to add for '+p.name+':'));if(!Number.isInteger(n)||n<=0)return alert('Enter a positive whole number.');p.qty+=n;save();render();}
document.querySelectorAll('.nav button').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
 document.querySelectorAll('.tab').forEach(t=>t.classList.remove('show'));$(btn.dataset.tab).classList.add('show');
}));
render();
