import Model from './model.js';

export default class Post extends Model {
    constructor() {
        super(true); //le id est un string ici pas un integer (sécurisé)

        this.addField('Title', 'string');
        this.addField('Text', 'string');
        this.addField('Category', 'string');
        this.addField('Image','asset');
        this.addField('Creation','integer')
              
        this.setKey("Title");
    }
}