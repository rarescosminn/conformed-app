import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
}
```

Salvează, apoi:
```
git add .
git commit -m "add: redirect homepage to login"
git push