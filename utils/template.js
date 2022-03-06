import ejs from 'ejs';

export default function render (content, data) {
    return ejs.render(content, data);
}