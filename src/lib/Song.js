export default class Song
{
    _id = '';
    _name = '';

    constructor(id, name = '')
    {
        this._id = id;
        this._name = name;
    }

    getId()
    {
        return this._id;
    }

    getName()
    {
        return this._name;
    }

    static initializeFromDataArray(songData)
    {
        let result = [];

        songData.forEach((songInfo) => {
            result.push(new Song(songInfo.id, songInfo.name));
        });

        return result;
    }

    getDisplayName()
    {
        return this._name;
    }
}