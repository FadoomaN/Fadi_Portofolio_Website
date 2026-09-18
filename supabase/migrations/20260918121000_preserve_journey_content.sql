-- Move the existing on-screen content into the CMS, without replacing existing records.
insert into public.threads(title,slug,destination,description,status,sort_order) values
('COOKING','cooking','journey','Food, recipes, experiments and things learned over time.','published',0),
('SPORTS','sports','journey','Training, progress and physical activities.','published',1),
('MARTIAL ARTS','martial-arts','journey','Practice, progress and things learned over time.','published',2),
('TRAVEL','travel','journey','Places, routes, observations and stories collected along the way.','published',3),
('MUSIC','music','journey','Sounds, records, instruments and ideas worth returning to.','published',4),
('PHOTOGRAPHY','photography','journey','Frames, light studies and visual notes from everyday life.','published',5),
('READING','reading','journey','Books, questions and concepts that stay in motion.','published',6),
('MAKING','making','journey','Small builds, experiments and practical things made by hand.','published',7),
('OUTDOORS','outdoors','journey','Time outside, changing landscapes and steady exploration.','published',8)
on conflict(slug) do nothing;
insert into public.thread_subthreads(thread_id,title,slug,description,status,sort_order)
select t.id,s.title,s.slug,s.description,'published',s.sort_order from public.threads t cross join (values
('RAMEN','ramen','Different ramen attempts, broths, noodles and improvements.',0),
('PASTA','pasta','Recipes, textures and techniques explored over time.',1),
('CHURROS','churros','Crisp dough, cinnamon sugar and repeatable results.',2),
('CHICKEN DISHES','chicken-dishes','Weeknight recipes, marinades and better preparation.',3),
('BAKING','baking','Doughs, oven experiments and lessons from each batch.',4),
('DESSERTS','desserts','Sweet recipes, finishing touches and new combinations.',5)
)s(title,slug,description,sort_order) where t.slug='cooking' and t.destination='journey'
on conflict(thread_id,slug) do nothing;
insert into public.thread_entries(thread_id,subthread_id,title,published_on,content,status,sort_order)
select t.id,s.id,'FIRST RAMEN ATTEMPT','2026-09-16',
'A first pass at building a richer broth, balancing the seasoning, and learning how the noodles change the whole bowl.',
'published',0 from public.threads t join public.thread_subthreads s on s.thread_id=t.id
where t.slug='cooking' and t.destination='journey' and s.slug='ramen'
and not exists(select 1 from public.thread_entries e where e.subthread_id=s.id);
;
