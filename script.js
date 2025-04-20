const openAiKey = "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";
const spotifyClientId = "674a0658b42044de9df08f42cf849253";
const spotifyClientSecret = "35ecfa704ca94829850f08fcd9986538";

const btn = document.getElementById("go");
const input = document.getElementById("vibe");
const resultDiv = document.getElementById("result");

let spotifyToken = "";

async function getSpotifyToken() {
  const creds = btoa(`${spotifyClientId}:${spotifyClientSecret}`);
  const resp = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://accounts.spotify.com/api/token"), {
    method: "POST",
    headers: {
      "Authorization": `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await resp.json();
  spotifyToken = data.access_token;
}

async function fetchOpenAiQuery(vibe) {
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt: `Generate a concise Spotify search term for the vibe: "${vibe}"`,
      max_tokens: 10,
      temperature: 0.7
    })
  });
  const json = await response.json();
  return json.choices[0].text.trim();
}

btn.onclick = async () => {
  const vibe = input.value.trim();
  if (!vibe) return alert("Please enter a vibe");
  resultDiv.innerHTML = "Loading...";

  try {
    if (!spotifyToken) await getSpotifyToken();
    const query = await fetchOpenAiQuery(vibe);
    const url = `https://api.allorigins.win/raw?url=` + encodeURIComponent(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`);
    const searchResp = await fetch(url, {
      headers: { Authorization: `Bearer ${spotifyToken}` }
    });
    const json = await searchResp.json();
    const track = json.tracks.items[0];
    if (!track) throw new Error("No track found.");

    resultDiv.innerHTML = `
      <p><strong>${track.name}</strong> by ${track.artists.map(a => a.name).join(", ")}</p>
      <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${track.id}" width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" loading="lazy"></iframe>
    `;
  } catch (err) {
    resultDiv.innerText = `Error: ${err.message}`;
    console.error(err);
  }
};