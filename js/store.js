// ── Keys ────────────────────────────────────────────────────────────────────
const K = {
  users:      'rs_users',
  current:    'rs_current_user',
  posts:      'rs_posts',
  friends:    'rs_friends',
  groups:     'rs_groups',
  gMembers:   'rs_group_members',
  gPosts:     'rs_group_posts',
  progress:   'rs_progress',
  likes:      'rs_likes',
};

function g(key) { try { return JSON.parse(localStorage.getItem(key)) ?? null; } catch { return null; } }
function s(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ── Store ────────────────────────────────────────────────────────────────────
export const store = {
  // Users
  getUsers:           ()       => g(K.users)   || [],
  setUsers:           (v)      => s(K.users, v),
  addUser:            (u)      => { const arr = g(K.users)||[]; arr.push(u); s(K.users,arr); },
  getUserById:        (id)     => (g(K.users)||[]).find(u => u.id === id) || null,
  getUserByUsername:  (name)   => (g(K.users)||[]).find(u => u.username.toLowerCase() === name.toLowerCase()) || null,
  updateUser: (id, patch) => {
    const arr = g(K.users)||[]; const i = arr.findIndex(u=>u.id===id);
    if (i!==-1) { arr[i]={...arr[i],...patch}; s(K.users,arr); return arr[i]; }
    return null;
  },

  // Session
  getCurrentUser:  ()  => g(K.current),
  setCurrentUser:  (u) => s(K.current, u),
  clearCurrentUser:()  => localStorage.removeItem(K.current),

  // Feed posts
  getPosts:  ()    => g(K.posts) || [],
  addPost:   (p)   => { const arr = g(K.posts)||[]; arr.unshift(p); s(K.posts,arr); },
  deletePost:(id)  => s(K.posts, (g(K.posts)||[]).filter(p=>p.id!==id)),

  // Friendships — shape: { id, from, to, status: 'pending'|'accepted' }
  getFriends:           () => g(K.friends) || [],
  addFriendship:        (f)=> { const arr=g(K.friends)||[]; arr.push(f); s(K.friends,arr); },
  updateFriendship: (id, patch) => {
    const arr=g(K.friends)||[]; const i=arr.findIndex(f=>f.id===id);
    if(i!==-1){arr[i]={...arr[i],...patch};s(K.friends,arr);}
  },
  removeFriendship: (id) => s(K.friends,(g(K.friends)||[]).filter(f=>f.id!==id)),
  getFriendship: (a, b) => (g(K.friends)||[]).find(f =>
    (f.from===a&&f.to===b)||(f.from===b&&f.to===a)
  ) || null,
  getFriendIds: (userId) => (g(K.friends)||[])
    .filter(f => (f.from===userId||f.to===userId) && f.status==='accepted')
    .map(f => f.from===userId ? f.to : f.from),
  getPendingRequests: (userId) => (g(K.friends)||[])
    .filter(f => f.to===userId && f.status==='pending'),

  // Groups
  getGroups:   () => g(K.groups) || [],
  addGroup:    (gr)=> { const arr=g(K.groups)||[]; arr.push(gr); s(K.groups,arr); },
  getGroupById:(id)=> (g(K.groups)||[]).find(gr=>gr.id===id)||null,
  updateGroup: (id,patch)=>{
    const arr=g(K.groups)||[];const i=arr.findIndex(gr=>gr.id===id);
    if(i!==-1){arr[i]={...arr[i],...patch};s(K.groups,arr);}
  },
  deleteGroup: (id) => s(K.groups,(g(K.groups)||[]).filter(gr=>gr.id!==id)),

  // Group members — shape: { groupId, userId, role:'admin'|'member' }
  getGroupMembers:   ()              => g(K.gMembers)||[],
  addGroupMember:    (m)             => { const arr=g(K.gMembers)||[]; arr.push(m); s(K.gMembers,arr); },
  removeGroupMember: (gid,uid)       => s(K.gMembers,(g(K.gMembers)||[]).filter(m=>!(m.groupId===gid&&m.userId===uid))),
  getGroupMembersOf: (gid)           => (g(K.gMembers)||[]).filter(m=>m.groupId===gid),
  isGroupMember:     (gid,uid)       => (g(K.gMembers)||[]).some(m=>m.groupId===gid&&m.userId===uid),
  getMyGroups:       (uid)           => {
    const myGids = (g(K.gMembers)||[]).filter(m=>m.userId===uid).map(m=>m.groupId);
    return (g(K.groups)||[]).filter(gr=>myGids.includes(gr.id));
  },

  // Group posts
  getGroupPosts:   ()    => g(K.gPosts)||[],
  addGroupPost:    (p)   => { const arr=g(K.gPosts)||[]; arr.unshift(p); s(K.gPosts,arr); },
  getGroupPostsOf: (gid) => (g(K.gPosts)||[]).filter(p=>p.groupId===gid),

  // Progress photos — shape: { id, userId, image, note, createdAt }
  getProgressPhotos:   ()     => g(K.progress)||[],
  addProgressPhoto:    (ph)   => { const arr=g(K.progress)||[]; arr.unshift(ph); s(K.progress,arr); },
  deleteProgressPhoto: (id)   => s(K.progress,(g(K.progress)||[]).filter(p=>p.id!==id)),
  getProgressOf:       (uid)  => (g(K.progress)||[]).filter(p=>p.userId===uid),

  // Likes — shape: { postId, userId }
  getLikes:      ()        => g(K.likes)||[],
  isLiked:       (pid,uid) => (g(K.likes)||[]).some(l=>l.postId===pid&&l.userId===uid),
  getLikeCount:  (pid)     => (g(K.likes)||[]).filter(l=>l.postId===pid).length,
  toggleLike: (pid,uid) => {
    const arr=g(K.likes)||[]; const i=arr.findIndex(l=>l.postId===pid&&l.userId===uid);
    if(i!==-1){arr.splice(i,1);s(K.likes,arr);return false;}
    arr.push({postId:pid,userId:uid});s(K.likes,arr);return true;
  },
};

// ── Seed demo data ───────────────────────────────────────────────────────────
export function seedIfEmpty() {
  if (store.getUsers().length > 0) return;

  const PASS = 'password';

  const users = [
    { id:'u1', username:'alexgains',  displayName:'Alex Gains',  password:PASS, bio:'Powerlifter 🏋️ | 3x per week',       avatar:'https://i.pravatar.cc/150?img=3',  joinedAt: Date.now()-86400000*30 },
    { id:'u2', username:'mariafit',   displayName:'Maria Fit',   password:PASS, bio:'CrossFit athlete 🔥 | PRs every week', avatar:'https://i.pravatar.cc/150?img=47', joinedAt: Date.now()-86400000*20 },
    { id:'u3', username:'tomlifts',   displayName:'Tom Lifts',   password:PASS, bio:'Bench 130 kg 💪 | Bulking szn',        avatar:'https://i.pravatar.cc/150?img=12', joinedAt: Date.now()-86400000*15 },
  ];
  store.setUsers(users);

  // Friendships (all three are friends)
  [
    { id:'fs1', from:'u1', to:'u2', status:'accepted' },
    { id:'fs2', from:'u1', to:'u3', status:'accepted' },
    { id:'fs3', from:'u2', to:'u3', status:'accepted' },
  ].forEach(f => store.addFriendship(f));

  // Feed posts
  const imgs = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=640&h=640&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=640&h=640&fit=crop',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=640&h=640&fit=crop',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=640&h=640&fit=crop',
    'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=640&h=640&fit=crop',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=640&h=640&fit=crop',
  ];

  [
    { id:'p1', userId:'u2', caption:'PR day 🙌 hit 100 kg deadlift finally! Hard work pays off.',        image:imgs[0], createdAt:Date.now()-3600000*2 },
    { id:'p2', userId:'u3', caption:'Morning session done ☀️ consistency is everything. No days off.',   image:imgs[1], createdAt:Date.now()-3600000*6 },
    { id:'p3', userId:'u1', caption:'Back day never misses 💪 dropped 2 kg this month too.',             image:imgs[2], createdAt:Date.now()-86400000 },
    { id:'p4', userId:'u2', caption:'Leg day suffering was worth it 🦵🔥 new squat PR incoming.',         image:imgs[3], createdAt:Date.now()-86400000*2 },
    { id:'p5', userId:'u3', caption:'Weekend warrior mode activated 🏋️ gym is my therapy.',              image:imgs[4], createdAt:Date.now()-86400000*3 },
    { id:'p6', userId:'u1', caption:'6 months progress 🔥 started from the bottom, now we here.',        image:imgs[5], createdAt:Date.now()-86400000*5 },
  ].forEach(p => store.addPost(p));

  // Likes
  [
    {postId:'p1',userId:'u1'},{postId:'p1',userId:'u3'},
    {postId:'p2',userId:'u1'},{postId:'p2',userId:'u2'},
    {postId:'p3',userId:'u2'},{postId:'p3',userId:'u3'},
    {postId:'p4',userId:'u1'},{postId:'p4',userId:'u3'},
    {postId:'p5',userId:'u1'},{postId:'p5',userId:'u2'},
    {postId:'p6',userId:'u2'},{postId:'p6',userId:'u3'},
  ].forEach(l => { const arr=store.getLikes(); arr.push(l); localStorage.setItem('rs_likes',JSON.stringify(arr)); });

  // Group
  store.addGroup({
    id:'g1', name:'Iron Brotherhood', code:'IRON42',
    description:'Weekly powerlifting sessions. All levels welcome. Gains only.',
    cover:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop',
    createdBy:'u1', createdAt:Date.now()-86400000*14,
  });
  [
    { groupId:'g1', userId:'u1', role:'admin'  },
    { groupId:'g1', userId:'u2', role:'member' },
    { groupId:'g1', userId:'u3', role:'member' },
  ].forEach(m => store.addGroupMember(m));

  // Group posts
  [
    { id:'gp1', groupId:'g1', userId:'u1', caption:'First group session 🔥 welcome everyone!',    image:imgs[2], createdAt:Date.now()-86400000*7 },
    { id:'gp2', groupId:'g1', userId:'u3', caption:'Great workout brothers! See you next week 💪', image:imgs[0], createdAt:Date.now()-86400000*3 },
    { id:'gp3', groupId:'g1', userId:'u2', caption:'New PR in the group session! 🏆',              image:imgs[5], createdAt:Date.now()-86400000   },
  ].forEach(p => store.addGroupPost(p));

  // Progress photos for alexgains
  [
    { id:'pp1', userId:'u1', image:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop', note:'Month 1 — Starting point', createdAt:Date.now()-86400000*90 },
    { id:'pp2', userId:'u1', image:'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=600&fit=crop', note:'Month 3 — Feeling stronger', createdAt:Date.now()-86400000*30 },
    { id:'pp3', userId:'u1', image:'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=400&h=600&fit=crop', note:'Month 6 — Big progress 🔥',  createdAt:Date.now()-86400000*7  },
  ].forEach(p => store.addProgressPhoto(p));
}
