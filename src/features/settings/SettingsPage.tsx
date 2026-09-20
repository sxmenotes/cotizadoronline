import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent, SectionHeader } from '../../ui';
import { CatalogTab } from './CatalogTab';
import { TermsTab } from './TermsTab';
import { IssuerTab } from './IssuerTab';
import { CurrencyTab } from './CurrencyTab';
import { DataTab } from './DataTab';
import { useSettingsStore } from '../../store/settingsStore';

export const SettingsPage: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { hydrate, isHydrated } = useSettingsStore();

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  const activeTab = tab || 'catalogo';

  const handleTabChange = (newTab: string) => {
    navigate(`/ajustes/${newTab}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Configuración del Sistema"
        title="Ajustes de la Plataforma"
        description="Personaliza tarifas vigentes, cláusulas normativas, identidad corporativa y copias de seguridad."
        hasHairline={false}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="catalogo">Catálogo de Planes</TabsTrigger>
          <TabsTrigger value="condiciones">Condiciones & Cláusulas</TabsTrigger>
          <TabsTrigger value="emisor">Emisor & Marca</TabsTrigger>
          <TabsTrigger value="moneda">Tipo de Cambio</TabsTrigger>
          <TabsTrigger value="datos">Respaldo & Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo">
          <CatalogTab />
        </TabsContent>

        <TabsContent value="condiciones">
          <TermsTab />
        </TabsContent>

        <TabsContent value="emisor">
          <IssuerTab />
        </TabsContent>

        <TabsContent value="moneda">
          <CurrencyTab />
        </TabsContent>

        <TabsContent value="datos">
          <DataTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
