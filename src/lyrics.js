async function getSong(index) {
    const response = await fetch('/chanson_list.json');
    const data = await response.json();
    
    if (!index || index < 0 || index >= data.length) {
        // index is the date of today
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1;
        index = (day * month) % data.length;

    }

    return data[index];
}

export { getSong };

