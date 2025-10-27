import {NextRequest, NextResponse} from 'next/server';
import {apiClient} from '@/lib/apiClient';

// GET /api/tenants -> passthrough to backend or mocks
export async function GET() {
    try {
        const resp = await apiClient.get('/tenants');
        return NextResponse.json(resp.data, {status: 200});
    } catch (err: any) {
        const status = err?.status || 500;
        const message = err?.message || 'Failed to fetch tenants';
        return NextResponse.json({message}, {status});
    }
}

// POST /api/tenants -> create a tenant
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // minimal validation
        const name = (body?.tenant_name || '').trim();
        const billing1 = (body?.billing_address_line1 || '').trim();
        if (!name) return NextResponse.json({message: 'tenant_name is required'}, {status: 400});
        if (!billing1) return NextResponse.json({message: 'billing_address_line1 is required'}, {status: 400});

        const resp = await apiClient.post('/tenants', body);
        return NextResponse.json(resp.data, {status: 201});
    } catch (err: any) {
        const status = err?.status || 500;
        const message = err?.message || 'Tenant creation failed';
        return NextResponse.json({message}, {status});
    }
}
