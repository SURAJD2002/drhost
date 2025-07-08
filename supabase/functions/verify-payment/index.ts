import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  console.log('Received request:', req.method, req.url);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || 'missing-url',
    Deno.env.get('SUPABASE_KEY') || 'missing-key'
  );

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const body = await req.json();
    console.log('Request body:', body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, address } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user_id || !address) {
      console.error('Missing fields:', { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, address });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log('Updating razorpay_orders:', { razorpay_order_id, razorpay_payment_id, status: 'paid' });
    const { error } = await supabase
      .from('razorpay_orders')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (error) {
      console.error('Supabase update error:', error);
      return new Response(JSON.stringify({ error: 'Failed to verify payment', details: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log('Updating orders:', { razorpay_order_id, order_status: 'confirmed' });
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        order_status: 'confirmed',
        payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single();

    if (orderError) {
      console.error('Supabase order update error:', orderError);
      return new Response(JSON.stringify({ error: 'Failed to update order', details: orderError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log('Payment verified successfully:', order);
    return new Response(JSON.stringify({ message: 'Payment verified successfully', order }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(JSON.stringify({ error: 'Failed to verify payment', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});