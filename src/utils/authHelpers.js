export async function safeSignOut(supabase) {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    try {
      // Fallback: clear local auth storage (client-side signout)
      const url = supabase?.supabaseUrl || process.env.REACT_APP_SUPABASE_URL || '';
      const refMatch = url.match(/https?:\/\/([^.]+)\./);
      const projectRef = refMatch ? refMatch[1] : '';
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.includes(projectRef)) {
          try { localStorage.removeItem(key); } catch (_) {}
        }
      }
      // Also clear legacy keys if present
      try { localStorage.removeItem('supabase.auth.token'); } catch (_) {}
      try { sessionStorage.removeItem('supabase.auth.token'); } catch (_) {}
      // Broadcast a storage event hint for listeners
      try { localStorage.setItem('sb-signout-ts', Date.now().toString()); } catch (_) {}
      return { error: null, fallback: true };
    } catch (_) {
      return { error: err };
    }
  }
}


