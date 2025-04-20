
import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

const saveNotificationPreferences = async (preferences: NotificationPreferences) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(preferences);
    }, 500);
  });
};

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate loading preferences from an API
    setIsLoading(true);
    setTimeout(() => {
      setPreferences({
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
      });
      setIsLoading(false);
    }, 500);
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      await saveNotificationPreferences(preferences);
      toast({
        title: "Preferências salvas",
        description: "Suas configurações de notificação foram atualizadas com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas preferências. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container max-w-2xl mx-auto mt-8 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Notificação</CardTitle>
          <CardDescription>Gerencie como você recebe atualizações e notificações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email">Notificações por Email</Label>
            <Switch
              id="email"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push">Notificações Push</Label>
            <Switch
              id="push"
              checked={preferences.pushNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms">Notificações por SMS</Label>
            <Switch
              id="sms"
              checked={preferences.smsNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('smsNotifications', checked)}
            />
          </div>
          <Button
            onClick={handleSaveSettings}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
