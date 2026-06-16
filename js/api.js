const BASE = '/Repsnap/api';

function token() { return localStorage.getItem('rs_token'); }
export function setToken(t) { t ? localStorage.setItem('rs_token', t) : localStorage.removeItem('rs_token'); }

async function req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token()) headers['Authorization'] = `Bearer ${token()}`;
    const r = await fetch(BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await r.json();
    if (!json.ok) throw new Error(json.error || 'Er ging iets mis');
    return json.data;
}

export const api = {
    // Auth
    me:            ()                          => req('GET',    '/auth.php'),
    signup:        (username, displayName, pw) => req('POST',   '/auth.php', { action:'signup', username, displayName, password:pw }),
    login:         (username, pw)              => req('POST',   '/auth.php', { action:'login',  username, password:pw }),
    logout:        ()                          => req('POST',   '/auth.php', { action:'logout' }),
    updateProfile: (patch)                     => req('PUT',    '/auth.php', patch),

    // Feed
    getPosts:      ()          => req('GET',    '/posts.php'),
    addPost:       (image, caption) => req('POST', '/posts.php', { image, caption }),
    deletePost:    (id)        => req('DELETE', `/posts.php?id=${id}`),
    toggleLike:    (postId)   => req('POST',   '/likes.php', { postId }),

    // Friends
    getFriends:    ()             => req('GET',    '/friends.php'),
    addFriend:     (toUsername)   => req('POST',   '/friends.php', { toUsername }),
    acceptFriend:  (id)           => req('PUT',    '/friends.php', { id }),
    removeFriend:  (id)           => req('DELETE', `/friends.php?id=${id}`),

    // Users
    searchUsers:   (q)  => req('GET', `/users.php?q=${encodeURIComponent(q)}`),

    // Groups
    getGroups:         ()                        => req('GET',    '/groups.php'),
    createGroup:       (name, description, cover)=> req('POST',   '/groups.php', { name, description, cover }),
    joinGroup:         (code)                    => req('POST',   '/groups.php', { code }),
    leaveGroup:        (id)                      => req('DELETE', `/groups.php?id=${id}&action=leave`),
    deleteGroup:       (id)                      => req('DELETE', `/groups.php?id=${id}&action=delete`),
    getGroupMembers:   (groupId)                 => req('GET',    `/group_members.php?groupId=${groupId}`),
    getGroupPosts:     (groupId)                 => req('GET',    `/group_posts.php?groupId=${groupId}`),
    addGroupPost:      (groupId, image, caption) => req('POST',   '/group_posts.php', { groupId, image, caption }),

    // Progress
    getProgress:    ()           => req('GET',    '/progress.php'),
    addProgress:    (image, note)=> req('POST',   '/progress.php', { image, note }),
    deleteProgress: (id)         => req('DELETE', `/progress.php?id=${id}`),

    // Chat
    getConversations:  ()                   => req('GET',  '/messages.php?type=conversations'),
    getDMs:            (withId)             => req('GET',  `/messages.php?type=dm&with=${withId}`),
    sendDM:            (toUserId, content)  => req('POST', '/messages.php', { type:'dm', toUserId, content }),
    getGroupMessages:  (groupId)            => req('GET',  `/messages.php?type=group&groupId=${groupId}`),
    sendGroupMessage:  (groupId, content)   => req('POST', '/messages.php', { type:'group', groupId, content }),
};
