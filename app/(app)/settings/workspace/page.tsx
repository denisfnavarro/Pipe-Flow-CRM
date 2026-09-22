import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireWorkspace } from "@/lib/auth";

export const metadata: Metadata = { title: "Workspace" };

export default async function WorkspaceSettingsPage() {
  const { workspace } = await requireWorkspace();
  const isAdmin = workspace.role === "admin";

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Identificação</CardTitle>
          <p className="text-xs text-muted-foreground">
            O nome aparece no seletor da barra lateral e nos e-mails de convite.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="workspace-name">Nome</Label>
            <Input id="workspace-name" defaultValue={workspace.name} disabled={!isAdmin} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workspace-slug">Identificador</Label>
            <Input
              id="workspace-slug"
              defaultValue={workspace.slug}
              className="font-mono"
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Gerado a partir do nome. Não pode ser alterado depois da criação.
            </p>
          </div>

          <div className="flex justify-end">
            {/* Renomear passa a persistir junto com a M11; aqui só o papel manda. */}
            <Button size="sm" disabled={!isAdmin}>
              Salvar alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card className="border-danger/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-danger">Excluir workspace</CardTitle>
            <p className="text-xs text-muted-foreground">
              Remove leads, negócios, atividades e membros deste workspace. A ação é definitiva.
            </p>
          </CardHeader>
          <CardContent>
            <Button size="sm" className="bg-danger text-danger-foreground hover:bg-danger/90">
              Excluir {workspace.name}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
