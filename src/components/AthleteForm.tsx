import { useState, useEffect } from 'react';
import { Athlete, Position, Team } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { uploadAthletePhoto } from '@/services/athleteService';
import { PhotoUploadAlert } from './PhotoUploadAlert';

interface AthleteFormProps {
  athlete?: Athlete;
  open: boolean;
  onClose: () => void;
  onSave: (athlete: Partial<Athlete>) => Promise<void>;
}

const POSITIONS: Position[] = [
  "Levantador",
  "Oposto",
  "Ponteiro",
  "Central",
  "Líbero",
  "Outro"
];

const TEAMS: Team[] = ["Masculino", "Feminino"];

const defaultAthlete: Partial<Athlete> = {
  nome: '',
  idade: 0,
  altura: 0,
  posicao: 'Outro',
  time: 'Masculino',
  foto_url: null,
};

const AthleteForm = ({ athlete, open, onClose, onSave }: AthleteFormProps) => {
  const [formData, setFormData] = useState<Partial<Athlete>>(athlete || defaultAthlete);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(athlete?.foto_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadAlert, setShowUploadAlert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (athlete) {
      setFormData(athlete);
      setPhotoPreview(athlete.foto_url || null);
    } else {
      setFormData(defaultAthlete);
      setPhotoPreview(null);
    }
    setPhotoFile(null);
  }, [athlete, open]);

  const handleChange = (field: keyof Athlete, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let photoUrl = formData.foto_url;

      if (photoFile) {
        try {
          photoUrl = await uploadAthletePhoto(photoFile);
        } catch (error: any) {
          setUploadError(error.message || "Não foi possível fazer upload da foto. Verifique o tamanho e o formato.");
          setShowUploadAlert(true);
          setIsSubmitting(false);
          return;
        }
      }

      await onSave({
        ...formData,
        foto_url: photoUrl,
      });
      
      toast({
        title: athlete ? "Atleta atualizado" : "Atleta adicionado",
        description: `${formData.nome} foi ${athlete ? "atualizado" : "adicionado"} com sucesso.`,
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error saving athlete:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || `Ocorreu um erro ao ${athlete ? "atualizar" : "adicionar"} o atleta.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithoutPhoto = async () => {
    setShowUploadAlert(false);
    setIsSubmitting(true);
    
    try {
      await onSave({
        ...formData,
        foto_url: formData.foto_url,
      });
      
      toast({
        title: athlete ? "Atleta atualizado" : "Atleta adicionado",
        description: `${formData.nome} foi ${athlete ? "atualizado" : "adicionado"} com sucesso, mas sem a nova foto.`,
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error saving athlete:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || `Ocorreu um erro ao ${athlete ? "atualizar" : "adicionar"} o atleta.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelUpload = () => {
    setShowUploadAlert(false);
    setIsSubmitting(false);
  };

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {athlete ? "Editar Atleta" : "Adicionar Atleta"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-primary">
                  <AvatarImage src={photoPreview || ''} alt="Foto de perfil" />
                  <AvatarFallback className="text-xl font-semibold">
                    {getInitials(formData.nome)}
                  </AvatarFallback>
                </Avatar>
                
                <Label 
                  htmlFor="photo-upload" 
                  className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer"
                >
                  <Camera className="h-4 w-4 text-primary-foreground" />
                  <Input 
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => handleChange('nome', e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idade">Idade</Label>
                <Input
                  id="idade"
                  type="number"
                  value={formData.idade || ''}
                  onChange={(e) => handleChange('idade', parseInt(e.target.value) || 0)}
                  min={0}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="altura">Altura (cm)</Label>
                <Input
                  id="altura"
                  type="number"
                  value={formData.altura || ''}
                  onChange={(e) => handleChange('altura', parseInt(e.target.value) || 0)}
                  min={0}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="posicao">Posição</Label>
              <Select 
                value={formData.posicao || 'Outro'} 
                onValueChange={(value) => handleChange('posicao', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a posição" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select 
                value={formData.time || 'Masculino'} 
                onValueChange={(value) => handleChange('time', value as Team)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando
                  </>
                ) : athlete ? (
                  'Atualizar'
                ) : (
                  'Adicionar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <PhotoUploadAlert
        open={showUploadAlert}
        onClose={() => setShowUploadAlert(false)}
        onContinue={handleContinueWithoutPhoto}
        onCancel={handleCancelUpload}
        error={uploadError || ""}
      />
    </>
  );
};

export default AthleteForm;
