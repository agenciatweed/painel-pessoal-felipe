import {access} from 'node:fs/promises';
for(const f of ['index.html','app.js','styles.css','assets/tweed.svg']) await access(new URL('../public/'+f,import.meta.url));
console.log('Interface e assets verificados. Dados pessoais são carregados pela API, fora do build.');
