import { Outlet, createFileRoute } from '@tanstack/react-router';
import { ZeroInit } from '~/components/zero-init';

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
  staleTime: Infinity,
});

function RouteComponent() {
  return (
    <ZeroInit>
      <Outlet />
    </ZeroInit>
  );
}
