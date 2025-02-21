async function getSong(index) {
    const response = await fetch("/songs_lyrics.json")
    const data = await response.json();
    return data[index];
}

async function getSongsInfo(songsFound) {
    const response = await fetch('/songs_lyrics.json');
    const data = await response.json();
  
    const stylesCount = data.reduce((acc, song, index) => {
      const style = song.style;
      if (!acc[style]) {
        acc[style] = { count: 0, indices: [], n_found: 0 };
      }
      acc[style].count++;
      acc[style].indices.push(index);
        if (songsFound.includes(index)) {
            acc[style].n_found++;
        }

      return acc;
    }, {});
  
    return stylesCount;
  }
  
export { getSong, getSongsInfo };



