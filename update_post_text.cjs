const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetCaption = `{/* Caption */}
        <div className="text-sm text-black dark:text-zinc-50 whitespace-pre-wrap leading-snug">
          <span className="font-bold mr-2 cursor-pointer hover:underline decoration-blue-500 underline-offset-2">{post.user?.name}</span>
          {post.content}
        </div>`;

const replaceCaption = `{/* Caption */}
        <div 
          className="text-sm text-black dark:text-zinc-50 whitespace-pre-wrap leading-snug cursor-pointer group"
          onClick={onPostClick}
        >
          <span className="font-bold mr-2 hover:underline decoration-blue-500 underline-offset-2">{post.user?.name}</span>
          <span className="group-hover:opacity-80 transition-opacity">
            {post.title && <strong className="block text-[15px] mb-1">{post.title}</strong>}
            {post.description || post.content}
          </span>
        </div>`;

if (code.includes(targetCaption)) {
    code = code.replace(targetCaption, replaceCaption);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Updated caption rendering and onClick");
} else {
    console.log("Could not find caption target");
}
