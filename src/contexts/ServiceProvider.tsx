import React, { createContext, useEffect, useContext, useMemo } from 'react';
import BrowseService from '../services/BrowseService';
import MetadataService from '../services/MetadataService';
import PlaylistService from '../services/PlaylistService';
import QueueService from '../services/QueueService';
import WeatherService from '../services/WeatherService';
import { useAppContext } from './AppContextProvider';
import { useSocket } from './SocketProvider';

export interface ServiceContextValue extends Record<string, any> {
  playlistService: PlaylistService;
  queueService: QueueService;
  browseService: BrowseService;
  metadataService: MetadataService;
  weatherService: WeatherService;
}

const ServiceContext = createContext({} as ServiceContextValue);

const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket } = useSocket();
  const { pluginInfo } = useAppContext();

  const services = useMemo(() => ({
    playlistService: new PlaylistService(),
    queueService: new QueueService(),
    browseService: new BrowseService(),
    metadataService: new MetadataService(),
    weatherService: new WeatherService()
  }), []);

  const apiPath = pluginInfo ? pluginInfo.apiPath : null;

  useEffect(() => {
    services.playlistService.setSocket(socket);
    services.queueService.setSocket(socket);
    services.browseService.setSocket(socket);
    services.weatherService.setSocket(socket);
  }, [ socket, services ]);

  useEffect(() => {
    services.metadataService.setApiPath(apiPath);
    services.weatherService.setApiPath(apiPath);
  }, [ apiPath, services ]);

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

const useService = (serviceName: string) => useContext(ServiceContext)[serviceName];
const usePlaylistService = (): PlaylistService => useService('playlistService');
const useQueueService = (): QueueService => useService('queueService');
const useBrowseService = (): BrowseService => useService('browseService');
const useMetadataService = (): MetadataService => useService('metadataService');
const useWeatherService = (): WeatherService => useService('weatherService');

export { usePlaylistService, useQueueService, useBrowseService, useMetadataService, useWeatherService, ServiceProvider };
