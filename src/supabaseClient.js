// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://arrettgksxgdajacsmbe.supabase.co'; // Replace with your Supabase Project URL
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycmV0dGdrc3hnZGFqYWNzbWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE4NDksImV4cCI6MjA1NjAzNzg0OX0.oKRNKtzFES3xign-jHMDkrmoDwJhD3DXTH3T6W5L8AQ'; // Replace with your Supabase Anon Key

// export const supabase = createClient(supabaseUrl, supabaseKey);


// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://ftaefpluizgfwviottma.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YWVmcGx1aXpnZnd2aW90dG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNzI0OTksImV4cCI6MjA1NTY0ODQ5OX0.PNs2ooNagTX3IrQc7URneG44yWfzW1c9QdhyiwB0V04'; // From Project Settings > API

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: true,
//   },
//   headers: {
//     'Accept': 'application/json', // Explicitly set Accept header
//   },
// });



// // import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://arrettgksxgdajacsmbe.supabase.co'; // Replace with your Supabase Project URL
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycmV0dGdrc3hnZGFqYWNzbWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE4NDksImV4cCI6MjA1NjAzNzg0OX0.oKRNKtzFES3xign-jHMDkrmoDwJhD3DXTH3T6W5L8AQ'; // Replace with your Supabase Anon Key

// // export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
// //   auth: {
// //     autoRefreshToken: true,
// //     persistSession: true,
// //     detectSessionInUrl: true,
// //   },
// //   headers: {
// //     'Accept': 'application/json', // Explicitly set Accept header
// //   },
// // });

// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// export const supabase = createClient(supabaseUrl, supabaseKey);


// src/lib/supabaseClient.ts (or .js if you’re not using TS)
import { createClient } from '@supabase/supabase-js';

/* ------------------------------------------------------------------ */
/* 1.  Read the env vars – works in BOTH Vite and CRA                 */
/* ------------------------------------------------------------------ */
const supabaseUrl =
  // Vite style
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  // CRA / Webpack style
  process.env.REACT_APP_SUPABASE_URL;

const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_KEY) ||
  process.env.REACT_APP_SUPABASE_KEY;

/* Guard-rail: throw a helpful error during dev/build  */
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[supabaseClient] Missing env variables. ' +
    'Add VITE_SUPABASE_URL / VITE_SUPABASE_KEY (Vite) or ' +
    'REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_KEY (CRA) to your .env file.'
  );
}

/* ------------------------------------------------------------------ */
/* 2.  Create the client – add a global Accept header to stop 406s    */
/* ------------------------------------------------------------------ */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: { Accept: 'application/json' }   // ← PostgREST always returns JSON
  }
});


// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://arrettgksxgdajacsmbe.supabase.co'; // Replace with your Supabase Project URL
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycmV0dGdrc3hnZGFqYWNzbWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE4NDksImV4cCI6MjA1NjAzNzg0OX0.oKRNKtzFES3xign-jHMDkrmoDwJhD3DXTH3T6W5L8AQ'; // Replace with your Supabase Anon Key


// export const supabase = createClient(supabaseUrl, supabaseKey);

// export const supabase = createClient(supabaseUrl, supabaseKey, {
//   autoRefreshToken: true, // Automatically refresh the token when it expires
//   persistSession: true,   // Persist the session across page reloads
//   detectSessionInUrl: true, // Handle the session from the URL (e.g., after OAuth)
// });