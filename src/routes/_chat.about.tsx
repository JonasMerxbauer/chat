import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ExternalLink, Github } from 'lucide-react';

export const Route = createFileRoute('/_chat/about')({
  component: RouteComponent,
  ssr: false,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card className="gap-2">
        <CardHeader>
          <CardTitle>
            <span>About This App</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This chat application was created during the{' '}
            <a
              href="https://cloneathon.t3.chat/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 font-medium underline"
            >
              T3 ChatCloneathon
              <ExternalLink className="h-3 w-3" />
            </a>{' '}
            competition.
          </p>

          <p className="text-muted-foreground">
            Built with{' '}
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 font-medium underline"
            >
              Tanstack Start
              <ExternalLink className="h-3 w-3" />
            </a>
            ,{' '}
            <a
              href="https://zero.rocicorp.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 font-medium underline"
            >
              Zero
              <ExternalLink className="h-3 w-3" />
            </a>
            ,{' '}
            <a
              href="https://better-auth.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 font-medium underline"
            >
              Better Auth
              <ExternalLink className="h-3 w-3" />
            </a>
            ,{' '}
            <a
              href="https://ai-sdk.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 font-medium underline"
            >
              AI SDK
              <ExternalLink className="h-3 w-3" />
            </a>
            , and{' '}
            <a
              href="https://www.neobrutalism.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 font-medium underline"
            >
              Neobrutalism Shadcn/ui
              <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>

          <div className="pt-4">
            <Button asChild>
              <a
                href="https://github.com/JonasMerxbauer/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
