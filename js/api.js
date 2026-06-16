const BASE = '/Repsnap/api';

function token() { return localStorage.getItem('rs_token'); }
export function setToken(t) { t ? localStorage.setItem('rs_token', t) : localStorage.removeItem('rs_token'); }

async function req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token()) headers['Authorization'] = `Bearer ${token()}`;
    const r = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const json = await r.json();
    if (!json.ok) throw new Error(json.error || 'Er ging iets mis');
    return json.data;
}

export async function uploadFile(file, onProgress) {
    const fd = new FormData();
    fd.append('file', file);
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', BASE + '/upload.php');
        if (token()) xhr.setRequestHeader('Authorization', `Bearer ${token()}`);
        if (onProgress) xhr.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
        xhr.onload = () => {
            try {
                const json = JSON.parse(xhr.responseText);
                json.ok ? resolve(json.data) : reject(new Error(json.error));
            } catch { reject(new Error('Upload mislukt')); }
        };
        xhr.onerror = () => reject(new Error('Netwerkfout bij upload'));
        xhr.send(fd);
    });
}

export const api = {
    me:            ()                          => req('GET',    '/auth.php'),
    signup:        (username, displayName, pw) => req('POST',   '/auth.php', { action:'signup', username, displayName, password:pw }),
    login:         (username, pw)              => req('POST',   '/auth.php', { action:'login',  username, password:pw }),
    logout:        ()                          => req('POST',   '/auth.php', { action:'logout' }),
    updateProfile: (patch)                     => req('PUT',    '/auth.php', patch),

    getPosts:      ()                   => req('GET',    '/posts.php'),
    addPost:       (image, caption, media_type) => req('POST', '/posts.php', { image, caption, media_type: media_type||'image' }),
    deletePost:    (id)                 => req('DELETE', `/posts.php?id=${id}`),
    toggleLike:    (postId)            => req('POST',   '/likes.php', { postId }),

    getFriends:    ()             => req('GET',    '/friends.php'),
    addFriend:     (toUsername)   => req('POST',   '/friends.php', { toUsername }),
    acceptFriend:  (id)           => req('PUT',    '/friends.php', { id }),
    removeFriend:  (id)           => req('DELETE', `/friends.php?id=${id}`),
    searchUsers:   (q)            => req('GET',    `/users.php?q=${encodeURIComponent(q)}`),

    getGroups:       ()                             => req('GET',    '/groups.php'),
    createGroup:     (name, description, cover)     => req('POST',   '/groups.php', { name, description, cover }),
    joinGroup:       (code)                         => req('POST',   '/groups.php', { code }),
    leaveGroup:      (id)                           => req('DELETE', `/groups.php?id=${id}&action=leave`),
    deleteGroup:     (id)                           => req('DELETE', `/groups.php?id=${id}&action=delete`),
    getGroupMembers: (groupId)                      => req('GET',    `/group_members.php?groupId=${groupId}`),
    getGroupPosts:   (groupId)                      => req('GET',    `/group_posts.php?groupId=${groupId}`),
    addGroupPost:    (groupId, image, caption, mt)  => req('POST',   '/group_posts.php', { groupId, image, caption, media_type: mt||'image' }),

    getProgress:    ()            => req('GET',    '/progress.php'),
    addProgress:    (image, note) => req('POST',   '/progress.php', { image, note }),
    deleteProgress: (id)          => req('DELETE', `/progress.php?id=${id}`),

    getConversations: ()                            => req('GET',  '/messages.php?type=conversations'),
    getDMs:           (withId)                      => req('GET',  `/messages.php?type=dm&with=${withId}`),
    sendDM:           (toUserId, content, att, at_type) => req('POST', '/messages.php', { type:'dm', toUserId, content, attachment:att||null, attach_type:at_type||null }),
    getGroupMessages: (groupId)                     => req('GET',  `/messages.php?type=group&groupId=${groupId}`),
    sendGroupMessage: (groupId, content, att, at_type)  => req('POST', '/messages.php', { type:'group', groupId, content, attachment:att||null, attach_type:at_type||null }),

    sendSignal: (to, type, data) => req('POST', '/signals.php', { to, type, data }),
    getSignals: (since)          => req('GET',  `/signals.php?since=${since||0}`),
};
