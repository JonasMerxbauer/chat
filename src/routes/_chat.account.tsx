import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useSession, deleteUser } from '~/auth';
import { clearZeroData } from '~/lib/zero-auth';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Trash2 } from 'lucide-react';

export const Route = createFileRoute('/_chat/account')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session?.user) {
    navigate({ to: '/auth' });
    return null;
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // Delete the user account using Better Auth
      const result = await deleteUser();

      if (result.error) {
        setError(result.error.message || 'Failed to delete account');
        return;
      }
      await clearZeroData();

      navigate({ to: '/' });
    } catch (err) {
      console.error('Delete account error:', err);
      setError('An unexpected error occurred while deleting your account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-destructive text-lg font-semibold">
              Danger Zone
            </h3>
            <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="text-destructive font-medium">
                    Delete Account
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                  <p className="text-muted-foreground text-sm font-medium">
                    This will delete all your conversations and messages.
                  </p>
                </div>

                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="ml-4 border-red-600 bg-red-600 text-white hover:bg-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-destructive">
                        Delete Account
                      </DialogTitle>
                      <DialogDescription className="space-y-2">
                        {error && (
                          <p className="text-destructive font-medium">
                            {error}
                          </p>
                        )}
                        <p>
                          This action will permanently delete your account and
                          all associated data including:
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-sm">
                          <li>Your profile information</li>
                          <li>All conversations and messages</li>
                          <li>Account preferences and settings</li>
                        </ul>
                        <p className="text-destructive font-medium">
                          This action cannot be undone.
                        </p>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="neutral"
                        onClick={() => {
                          setDeleteDialogOpen(false);
                          setError(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
