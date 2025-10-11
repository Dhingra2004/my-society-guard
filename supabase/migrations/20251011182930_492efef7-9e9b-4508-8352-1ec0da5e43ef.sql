-- Create enum for user roles
create type public.app_role as enum ('admin', 'guard', 'resident');

-- Create enum for complaint status
create type public.complaint_status as enum ('pending', 'in_progress', 'resolved', 'closed');

-- Create enum for complaint category
create type public.complaint_category as enum ('maintenance', 'water_supply', 'security', 'electricity', 'cleaning', 'other');

-- Create enum for visitor request status
create type public.visitor_status as enum ('pending', 'approved', 'denied', 'completed');

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  phone_number text,
  flat_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, role)
);

-- Create visitors table
create table public.visitors (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null,
  visitor_phone text not null,
  purpose text not null,
  flat_number text not null,
  resident_id uuid references auth.users(id) not null,
  guard_id uuid references auth.users(id) not null,
  status visitor_status default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  approved_at timestamp with time zone,
  notes text
);

-- Create complaints table
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references auth.users(id) on delete cascade not null,
  category complaint_category not null,
  title text not null,
  description text not null,
  status complaint_status default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone
);

-- Create notices table
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  is_urgent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.visitors enable row level security;
alter table public.complaints enable row level security;
alter table public.notices enable row level security;

-- Create security definer function to check user role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.has_role(auth.uid(), 'admin'));

-- User roles policies
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- Visitors policies
create policy "Guards can create visitor requests"
  on public.visitors for insert
  with check (public.has_role(auth.uid(), 'guard'));

create policy "Guards can view all visitor requests"
  on public.visitors for select
  using (public.has_role(auth.uid(), 'guard'));

create policy "Residents can view their visitor requests"
  on public.visitors for select
  using (auth.uid() = resident_id);

create policy "Residents can update their visitor requests"
  on public.visitors for update
  using (auth.uid() = resident_id);

create policy "Admins can view all visitors"
  on public.visitors for select
  using (public.has_role(auth.uid(), 'admin'));

-- Complaints policies
create policy "Residents can create complaints"
  on public.complaints for insert
  with check (auth.uid() = resident_id);

create policy "Residents can view their own complaints"
  on public.complaints for select
  using (auth.uid() = resident_id);

create policy "Admins can view all complaints"
  on public.complaints for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all complaints"
  on public.complaints for update
  using (public.has_role(auth.uid(), 'admin'));

-- Notices policies
create policy "Everyone can view active notices"
  on public.notices for select
  using (auth.uid() is not null);

create policy "Admins can manage notices"
  on public.notices for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone_number, flat_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone_number', ''),
    coalesce(new.raw_user_meta_data->>'flat_number', '')
  );
  
  -- Assign default role (resident) if not specified
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'resident')
  );
  
  return new;
end;
$$;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add triggers for updated_at
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.visitors
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.complaints
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.notices
  for each row execute procedure public.handle_updated_at();

-- Enable realtime for visitors table (for real-time notifications)
alter publication supabase_realtime add table public.visitors;