-- Ensure trigger to populate profiles and roles on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure authenticated users can call helper function (already present but re-grant to be safe)
GRANT EXECUTE ON FUNCTION public.lookup_resident_id_by_flat(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;