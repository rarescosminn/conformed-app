// app/chestionar/page.tsx
export const metadata = { title: 'Chestionar' };

import QuestionnaireTable from '@/components/QuestionnaireTable';

export default function ChestionarPage() {
    return (
        <>
            <h1 className="h1">Chestionar</h1>
            <QuestionnaireTable />
        </>
    );
}
