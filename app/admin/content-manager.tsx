'use client';
import { FormEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Entry, Subthread, Thread } from '@/lib/content';
import { safeReference } from '@/lib/content';
import { filterContent } from '@/lib/filter-content';
import JourneyThumbnail from '../journey/journey-thumbnail';
import CircuitDivider from '../circuit-divider';
import './cms.css';

type Category = { id: string; name: string };
type SubthreadWithPost = Subthread & { thread_entries: Entry[] };
type Kind = 'thread' | 'subthread';
type Draft = {
  id: string; title: string; slug: string; description: string; category: string;
  content: string; status: string; sort_order: number; featured: boolean;
  cover_media_reference: string; cover_position_x: number; cover_position_y: number;
  published_on: string; comments_enabled: boolean;
};
const today = () => new Date().toLocaleDateString('en-CA');
const blank = (): Draft => ({
  id: '', title: '', slug: '', description: '', category: '', content: '',
  status: 'draft', sort_order: 0, featured: false, cover_media_reference: '',
  cover_position_x: 50, cover_position_y: 50, published_on: today(), comments_enabled: true,
});
const slugify = (value: string) => value.toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clamp = (value: number) => Math.min(100, Math.max(0, value));
function draftFrom(record: Partial<Thread | SubthreadWithPost>): Draft {
  const post = 'thread_entries' in record ? record.thread_entries?.[0] : undefined;
  return {
    ...blank(), ...Object.fromEntries(Object.entries(record).filter(([, value]) => value != null)),
    cover_media_reference: record.cover_media_reference ?? '',
    cover_position_x: record.cover_position_x ?? 50,
    cover_position_y: record.cover_position_y ?? 50,
    content: post?.content ?? '',
    published_on: post?.published_on ?? today(),
    comments_enabled: post?.comments_enabled ?? true,
  } as Draft;
}
function CoverCrop({src,x,y,onChange}:{src:string;x:number;y:number;onChange:(x:number,y:number)=>void}) {
  const pointer = useRef<{clientX:number;clientY:number;x:number;y:number}|null>(null);
  function start(event:PointerEvent<HTMLDivElement>) {
    pointer.current={clientX:event.clientX,clientY:event.clientY,x,y};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event:PointerEvent<HTMLDivElement>) {
    if(!pointer.current)return;
    const rect=event.currentTarget.getBoundingClientRect();
    onChange(clamp(Math.round(pointer.current.x-(event.clientX-pointer.current.clientX)/rect.width*100)),
      clamp(Math.round(pointer.current.y-(event.clientY-pointer.current.clientY)/rect.height*100)));
  }
  return <div className="journey-admin-crop">
    <div className="journey-admin-crop-frame" onPointerDown={start} onPointerMove={move} onPointerUp={()=>{pointer.current=null;}} onPointerCancel={()=>{pointer.current=null;}}
      aria-label="Thumbnail preview. Drag the photo to adjust its position.">
      <img src={src} alt="Thumbnail crop preview" style={{objectPosition:`${x}% ${y}%`}} draggable={false} />
      <span>DRAG TO ADJUST</span>
    </div>
    <div className="journey-admin-crop-sliders">
      <label>Horizontal <input type="range" min="0" max="100" value={x} onChange={event=>onChange(Number(event.target.value),y)} /></label>
      <label>Vertical <input type="range" min="0" max="100" value={y} onChange={event=>onChange(x,Number(event.target.value))} /></label>
    </div>
    <small>This 16:9 frame matches the thumbnail visitors see.</small>
  </div>;
}

export default function ContentManager({initialThreads,initialCategories}:{initialThreads:Thread[];initialCategories:Category[]}) {
  const router=useRouter();
  const [threads,setThreads]=useState(initialThreads.filter(item=>item.destination==='journey'));
  const [categories,setCategories]=useState(initialCategories);
  const [threadId,setThreadId]=useState('');
  const [content,setContent]=useState<{key:string;subthreads:SubthreadWithPost[]}>({key:'',subthreads:[]});
  const [revision,setRevision]=useState(0);
  const [kind,setKind]=useState<Kind|null>(null);
  const [draft,setDraft]=useState<Draft>(blank);
  const [mediaMode,setMediaMode]=useState<'none'|'image'>('none');
  const [mediaImage,setMediaImage]=useState('');
  const [mediaAlt,setMediaAlt]=useState('');
  const [search,setSearch]=useState('');
  const [subthreadSearch,setSubthreadSearch]=useState('');
  const [filter,setFilter]=useState('all');
  const [addingCategory,setAddingCategory]=useState(false);
  const [categoryName,setCategoryName]=useState('');
  const [dirty,setDirty]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [deleteOpen,setDeleteOpen]=useState(false);
  const [deleteConfirmation,setDeleteConfirmation]=useState('');
  const lock=useRef(false);
  const thread=threads.find(item=>item.id===threadId);
  const contentKey=threadId?`${threadId}:${revision}`:'';
  const loading=Boolean(threadId&&content.key!==contentKey);
  const subthreads=loading?[]:content.subthreads;
  const visible=filterContent(threads.filter(item=>filter==='all'||item.status===filter),search,item=>[item.title,item.description,item.category])
    .sort((a,b)=>Number(b.featured)-Number(a.featured)||a.sort_order-b.sort_order||a.title.localeCompare(b.title));
  const visibleSubthreads=filterContent(subthreads,subthreadSearch,item=>[item.title,item.description]);

  useEffect(()=>{
    window.dispatchEvent(new CustomEvent('admin-dirty',{detail:dirty}));
    const prevent=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',prevent);
    return()=>{window.removeEventListener('beforeunload',prevent);window.dispatchEvent(new CustomEvent('admin-dirty',{detail:false}));};
  },[dirty]);
  useEffect(()=>{
    if(!threadId)return;
    const controller=new AbortController();
    fetch(`/api/admin/editor?thread=${threadId}`,{signal:controller.signal}).then(async response=>{
      const result=await response.json() as {subthreads:SubthreadWithPost[];error?:string};
      if(!response.ok)throw new Error(result.error);
      if(!controller.signal.aborted)setContent({key:contentKey,subthreads:result.subthreads});
    }).catch(cause=>{if(!controller.signal.aborted){setError(cause.message);setContent({key:contentKey,subthreads:[]});}});
    return()=>controller.abort();
  },[threadId,contentKey]);
  const canLeave=()=>!busy&&(!dirty||window.confirm('You have unsaved changes. Leave without saving?'));
  function select(nextKind:Kind,record:Partial<Thread|SubthreadWithPost>={}) {
    const post='thread_entries' in record?record.thread_entries?.[0]:undefined;
    const image=post?.thread_media?.find(item=>item.media_type==='image');
    setKind(nextKind);setDraft(draftFrom(record));setMediaMode(image?'image':'none');
    setMediaImage(image?.media_reference??'');setMediaAlt(image?.media_alt??'');
    setDirty(false);setError('');setNotice('');setDeleteOpen(false);setDeleteConfirmation('');
  }
  function home(){if(!canLeave())return;setKind(null);setThreadId('');setSubthreadSearch('');setDirty(false);setError('');setNotice('');}
  function openThread(item:Thread){if(!canLeave())return;setThreadId(item.id);setSubthreadSearch('');select('thread',item);}
  function openSubthread(item:SubthreadWithPost){if(!canLeave())return;select('subthread',item);}
  function create(nextKind:Kind) {
    if(!canLeave())return;
    if(nextKind==='thread')setThreadId('');
    select(nextKind,{sort_order:nextKind==='thread'?threads.length:subthreads.length});
    setDirty(true);
  }
  function change<K extends keyof Draft>(key:K,value:Draft[K]) {
    setDraft(current=>({...current,[key]:value}));setDirty(true);setNotice('');
  }
  async function uploadImage(file:File|undefined,target:'cover'|'media') {
    if(!file||lock.current)return;
    lock.current=true;setBusy(true);setError('');setNotice('Uploading image…');
    try {
      const form=new FormData();form.set('file',file);
      const response=await fetch('/api/admin/media',{method:'POST',body:form});
      const result=await response.json() as {url:string;error?:string};
      if(!response.ok)throw new Error(result.error);
      if(target==='cover')change('cover_media_reference',result.url);
      else {setMediaImage(result.url);setDirty(true);}
      setNotice('Image ready. Save your changes to publish it.');
    } catch(cause){setError((cause as Error).message);setNotice('');}
    finally{lock.current=false;setBusy(false);}
  }
  async function addCategory() {
    if(!categoryName.trim()||lock.current)return;
    lock.current=true;setBusy(true);setError('');
    try {
      const response=await fetch('/api/admin/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:categoryName})});
      const result=await response.json() as {category:Category;error?:string};
      if(!response.ok)throw new Error(result.error);
      setCategories(items=>[...items,result.category].sort((a,b)=>a.name.localeCompare(b.name)));
      change('category',result.category.name);setCategoryName('');setAddingCategory(false);
    } catch(cause){setError((cause as Error).message);}
    finally{lock.current=false;setBusy(false);}
  }
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(lock.current||!kind)return;
    if(kind==='subthread'&&mediaMode==='image'&&!mediaImage){setError('Upload an image or choose No media.');return;}
    lock.current=true;setBusy(true);setError('');setNotice('');
    const media=kind==='subthread'&&mediaMode==='image'?[{
      media_type:'image',media_reference:mediaImage,media_alt:mediaAlt,
      caption:'',media_shape:'landscape',media_position:'right',sort_order:0,
    }]:[];
    try {
      const response=await fetch('/api/admin/editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        kind,record:{...draft,thread_id:threadId,cover_media_reference:draft.cover_media_reference||null},
        publishedOn:draft.published_on,content:draft.content,commentsEnabled:draft.comments_enabled,media,
      })});
      const result=await response.json() as {record:Thread|SubthreadWithPost;error?:string};
      if(!response.ok)throw new Error(result.error);
      setDraft(draftFrom(result.record));setDirty(false);
      setNotice(draft.status==='published'?'Saved — your changes are live.':draft.status==='archived'?'Saved — hidden from visitors.':'Draft saved. Only you can see it.');
      if(kind==='thread'){
        const saved=result.record as Thread;
        setThreads(items=>items.some(item=>item.id===saved.id)?items.map(item=>item.id===saved.id?saved:item):[...items,saved]);
        setThreadId(saved.id);
      } else setRevision(value=>value+1);
      router.refresh();
    } catch(cause){setError((cause as Error).message);}
    finally{lock.current=false;setBusy(false);}
  }
  async function deleteRecord() {
    if (!kind || !draft.id || deleteConfirmation !== draft.title || dirty || lock.current) return;
    lock.current=true;setBusy(true);setError('');setNotice('');
    try {
      const response=await fetch('/api/admin/editor',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,id:draft.id,confirmTitle:deleteConfirmation})});
      const result=await response.json() as {ok?:boolean;error?:string};
      if(!response.ok || !result.ok)throw new Error(result.error||'Delete failed. Try again.');
      if(kind==='thread'){
        setThreads(items=>items.filter(item=>item.id!==draft.id));
        setThreadId('');setKind(null);setNotice(`Thread “${draft.title}” deleted.`);
      }else{
        setKind('thread');setDraft(draftFrom(thread??{}));setRevision(value=>value+1);
        setNotice(`Subthread “${draft.title}” deleted.`);
      }
      setDirty(false);setDeleteOpen(false);setDeleteConfirmation('');router.refresh();
    }catch(cause){setError((cause as Error).message);}
    finally{lock.current=false;setBusy(false);}
  }
  const canPreview=Boolean(draft.id&&draft.status==='published'&&!dirty&&(kind==='thread'||thread?.status==='published'));
  const preview=kind==='thread'?`/journey/${draft.slug}`:`/journey/${thread?.slug}/${draft.slug}`;
  return <div className="journey-admin">
    <div className="journey-admin-toolbar">
      <nav aria-label="Threads sections"><button type="button" aria-current="page" onClick={home}>Journey</button><button type="button" disabled aria-label="Projects temporarily unavailable">Projects</button></nav>
      {thread&&<div className="journey-admin-location"><button type="button" onClick={()=>openThread(thread)}>{thread.title}</button>{kind==='subthread'&&<><span>/</span><span>{draft.title||'New subthread'}</span></>}</div>}
      {kind&&<button type="button" onClick={home}>All threads</button>}
    </div>
    {!kind&&notice&&<p className="journey-admin-notice" role="status">{notice}</p>}
    {!kind?<><header className="journey-admin-start"><div><p className="journey-kicker">Your Journey / edit mode</p><h2>JOURNEY</h2><p>Choose a thread, then edit its subthreads. Each subthread is a story with media or article text.</p></div><button type="button" className="admin-profile-save" onClick={()=>create('thread')}>+ New thread</button></header>
      <div className="journey-admin-filters"><label>Find a thread<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search title, description, category…" /></label><label>Show<select value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">All threads</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option></select></label></div>
      <div className="journey-thread-list">{visible.map(item=><button type="button" className="journey-thread journey-admin-card" key={item.id} onClick={()=>openThread(item)}>
        <JourneyThumbnail kind="thread" reference={item.cover_media_reference} x={item.cover_position_x} y={item.cover_position_y} />
        <div className="journey-thread-copy"><span className="journey-thread-label">{item.category||'Uncategorized'} / {item.status}</span><h3>{item.title}</h3><p>{item.description}</p><small>OPEN & EDIT ↗</small></div>
      </button>)}</div>
      {!visible.length&&<div className="journey-admin-empty"><h3>{threads.length?'No matching threads':'Your Journey starts here'}</h3><p>{threads.length?'Try another search or filter.':'Create a thread, then add a subthread with a photo or article.'}</p>{!threads.length&&<button type="button" onClick={()=>create('thread')}>Create your first thread</button>}</div>}
    </>:<form onSubmit={save} onInvalid={event=>{const settings=(event.target as HTMLElement).closest('details');if(settings)settings.open=true;}} className="journey-admin-page">
      <div className="journey-admin-edit-hint"><span>EDITING {kind.toUpperCase()}</span><p>{kind==='thread'?'This page contains your subthreads.':'This subthread is what visitors will read and react to.'}</p>{canPreview&&<a href={preview} target="_blank" rel="noopener noreferrer">View live page ↗</a>}</div>
      <fieldset disabled={busy} className="journey-admin-surface">
        <header className="journey-subthread-intro"><label className="journey-admin-inline-label"><span>{kind==='thread'?'Thread title':'Subthread title'}</span><textarea className="journey-admin-title" rows={1} required maxLength={160} placeholder={kind==='thread'?'Name your thread':'Name this story'} value={draft.title} onChange={event=>{const title=event.target.value;setDraft(current=>({...current,title,slug:!current.id&&current.slug===slugify(current.title)?slugify(title):current.slug}));setDirty(true);setNotice('');}} /></label>
          <label className="journey-admin-inline-label"><span>{kind==='thread'?'Description':'Short introduction'}</span><textarea className="journey-admin-description" rows={2} maxLength={10000} placeholder="A few words about this…" value={draft.description} onChange={event=>change('description',event.target.value)} /></label>
        </header>
        <CircuitDivider />
        <div className="journey-admin-content">
          {kind==='thread'&&<div className="journey-admin-category"><label>Category<select value={draft.category} onChange={event=>change('category',event.target.value)}><option value="">Uncategorized</option>{categories.map(item=><option key={item.id} value={item.name}>{item.name}</option>)}</select></label><button type="button" onClick={()=>setAddingCategory(value=>!value)}>+ Add category</button>
            {addingCategory&&<div className="journey-admin-add-category"><input value={categoryName} maxLength={60} aria-label="New category name" placeholder="New category name" onChange={event=>setCategoryName(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();void addCategory();}}} /><button type="button" disabled={busy||categoryName.trim().length<2} onClick={()=>void addCategory()}>Add to list</button></div>}
          </div>}
          <section className="journey-admin-cover"><div><span className="journey-admin-inline-label">THUMBNAIL</span><p>The image shown on the Journey card. This is separate from the story media.</p></div>
            <div className="journey-admin-cover-actions"><label className="admin-upload-button">{draft.cover_media_reference?'Replace thumbnail':'Upload thumbnail'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event=>{void uploadImage(event.target.files?.[0],'cover');event.target.value='';}} /></label>{draft.cover_media_reference&&<button type="button" onClick={()=>change('cover_media_reference','')}>Remove thumbnail</button>}</div>
            {safeReference(draft.cover_media_reference)&&<CoverCrop src={draft.cover_media_reference} x={draft.cover_position_x} y={draft.cover_position_y} onChange={(x,y)=>{setDraft(current=>({...current,cover_position_x:x,cover_position_y:y}));setDirty(true);setNotice('');}} />}
          </section>
          {kind==='subthread'&&<>
            <section className="journey-admin-story"><h3>Story media</h3><label>Media<select value={mediaMode} onChange={event=>{setMediaMode(event.target.value as 'none'|'image');if(event.target.value==='none'){setMediaImage('');setMediaAlt('');}setDirty(true);setNotice('');}}><option value="none">No media — article</option><option value="video" disabled>Video — coming soon</option><option value="image">Image</option></select></label>
              {mediaMode==='image'&&<><label className="admin-upload-button">{mediaImage?'Replace story image':'Upload story image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event=>{void uploadImage(event.target.files?.[0],'media');event.target.value='';}} /></label>
                {safeReference(mediaImage)?<figure className="journey-entry-media"><img src={mediaImage} alt={mediaAlt||'Story image preview'} /></figure>:<div className="journey-admin-image-empty">Upload an image to preview it here.</div>}
                <label>Image description <small>For visitors using a screen reader</small><input value={mediaAlt} maxLength={300} placeholder="Describe the image" onChange={event=>{setMediaAlt(event.target.value);setDirty(true);}} /></label>
              </>}
              {mediaMode==='none'&&<p className="journey-admin-help">Without media, this story appears as an article.</p>}
            </section>
            <label className="journey-admin-inline-label"><span>Article text</span><textarea className="journey-admin-body" rows={10} value={draft.content} maxLength={100000} placeholder="Write your story here…" onChange={event=>change('content',event.target.value)} /></label>
          </>}
          <details className="journey-admin-more"><summary>More settings</summary><div className="journey-admin-settings">
            <label>Page address<input value={draft.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} required onChange={event=>change('slug',event.target.value)} /><small>Created automatically from the title.</small></label>
            <label>Display order<input type="number" value={draft.sort_order} min={-100000} max={100000} onChange={event=>change('sort_order',Number(event.target.value))} /><small>Lower numbers appear first.</small></label>
            {kind==='subthread'&&<><label>Date<input type="date" required value={draft.published_on} onChange={event=>change('published_on',event.target.value)} /></label><label className="journey-admin-check"><input type="checkbox" checked={draft.comments_enabled} onChange={event=>change('comments_enabled',event.target.checked)} />Allow comments</label></>}
            {kind==='thread'&&<label className="journey-admin-check"><input type="checkbox" checked={draft.featured} onChange={event=>change('featured',event.target.checked)} />Show this thread first</label>}
          </div></details>
        </div>
      </fieldset>
      <div className="journey-admin-save"><label>Visibility<select disabled={busy} value={draft.status} onChange={event=>change('status',event.target.value)}><option value="draft">Draft — just for you</option><option value="published">Published — everyone</option><option value="archived">Archived — hidden</option></select></label><div>{error&&<p role="alert" className="admin-profile-error">{error}</p>}{notice&&<p role="status">{notice}</p>}{!notice&&!error&&<small>{dirty?'You have unsaved changes':'All changes saved'}</small>}{kind==='subthread'&&thread?.status!=='published'&&<small>Publish the parent thread before visitors can see this story.</small>}</div><button className="admin-profile-save" type="submit" disabled={busy||!dirty}>{busy?'Saving…':'Save changes'}</button></div>
    </form>}
    {kind==='thread'&&draft.id&&<section className="journey-admin-children"><div className="journey-admin-section-heading"><div><small>Inside this thread</small><h3>SUBTHREADS</h3></div><button type="button" disabled={busy||loading} onClick={()=>create('subthread')}>+ New subthread</button></div>
      {!loading&&subthreads.length>0&&<label className="journey-admin-subthread-search">Find a subthread<input type="search" value={subthreadSearch} onChange={event=>setSubthreadSearch(event.target.value)} placeholder="Search title or description…" /></label>}
      {loading?<p role="status">Loading your subthreads…</p>:<div className="journey-subthread-list">{visibleSubthreads.map(item=><button type="button" className="journey-subthread journey-admin-card" key={item.id} onClick={()=>openSubthread(item)}>
        <JourneyThumbnail kind="subthread" reference={item.cover_media_reference} x={item.cover_position_x} y={item.cover_position_y} />
        <div className="journey-subthread-copy"><small>{item.status}</small><h3>{item.title}</h3><p>{item.description}</p><small>OPEN & EDIT ↗</small></div>
      </button>)}</div>}
      {!loading&&!subthreads.length&&<p className="journey-admin-help">Add a subthread to publish a photo story or article.</p>}
      {!loading&&subthreads.length>0&&!visibleSubthreads.length&&<p className="journey-admin-no-results" role="status">NO SUBTHREADS FOUND</p>}
    </section>}
    {kind&&draft.id&&<section className="journey-admin-danger" aria-labelledby="journey-admin-danger-title">
      <h3 id="journey-admin-danger-title">DANGER ZONE</h3>
      <p>Deleting this {kind} permanently removes its story and related comments and reactions.</p>
      {!deleteOpen?<button type="button" className="journey-admin-delete" disabled={busy||dirty} onClick={()=>{setDeleteOpen(true);setDeleteConfirmation('');setError('');}}>DELETE {kind.toUpperCase()}</button>
        :<div className="journey-admin-delete-confirm"><label>Type <strong>{draft.title}</strong> to confirm<input value={deleteConfirmation} onChange={event=>setDeleteConfirmation(event.target.value)} autoComplete="off" /></label><div><button type="button" onClick={()=>{setDeleteOpen(false);setDeleteConfirmation('');}}>Cancel</button><button type="button" className="journey-admin-delete" disabled={busy||deleteConfirmation!==draft.title} onClick={()=>void deleteRecord()}>{busy?'Deleting…':`Permanently delete ${kind}`}</button></div></div>}
      {dirty&&<small>Save or discard your unsaved changes before deleting.</small>}
      {error&&<p role="alert" className="admin-profile-error">{error}</p>}
    </section>}
  </div>;
}
