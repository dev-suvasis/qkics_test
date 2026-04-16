import axiosSecure from "./axiosSecure";

export async function endCall(call_room_id) {
  const res = await axiosSecure.post(`/v1/calls/${call_room_id}/end/`);
  return res.status === 200;
}

export async function getCallRoom(call_room_id) {
  const res = await axiosSecure.get(`/v1/calls/${call_room_id}/`);
  return res.data;
}

export async function getCallMessages(call_room_id) {
  try {
    const res = await axiosSecure.get(`/v1/calls/${call_room_id}/messages/`);
    return res.data?.results || res.data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function uploadCallFile(call_room_id, file) {
  if (file.size > 50 * 1024 * 1024) throw new Error("File exceeds 50MB");
  const form = new FormData();
  form.append("file", file);
  const res = await axiosSecure.post(`/v1/calls/${call_room_id}/upload/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}  

export async function getMyNote(call_room_id) {
  try {
    const res = await axiosSecure.get(`/v1/calls/${call_room_id}/notes/`);
    return res.data || { content: "" };
  } catch (err) {
    console.error(err);
    return { content: "" };
  }
}

export async function saveMyNote(call_room_id, content) {
  const res = await axiosSecure.post(`/v1/calls/${call_room_id}/notes/`, { content });
  return res.status === 200 || res.status === 201;
}
