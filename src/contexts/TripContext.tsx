import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ComfortPreferenceId, PaymentMethodType, PaymentState, SavedPlace, TripRequest, VehicleCategoryId } from '../types';
import { computeChangeKz, defaultOrigin, estimateTrip } from '../services/mockData';
import { CancellationRisk, recordCancellation } from '../services/cancellationStore';
import { recordTripEvent } from '../services/tripEventStore';
import { mirrorCancel, mirrorComplete, mirrorCreateAndAssign, mirrorStart, RealDriverAssignment, mirrorCreateScheduled, mirrorRemoteId, mirrorAdopt } from '../services/tripMirror';
import { tripsApi } from '../services/api';
import { Alert } from 'react-native';
import { connectTripSocket } from '../services/tripSocket';
import { tripLiveRemote } from '../services/extrasApi';
import { syncPricing } from '../services/pricingSync';
import { useSettings } from './SettingsContext';

export interface RequestedForSomeoneElse {
  name: string;
  phone: string;
}

export interface TripDraft {
  origin: SavedPlace;
  destination: SavedPlace | null;
  distanceKm: number;
  selectedCategoryId: VehicleCategoryId | null;
  scheduledFor: Date | null;
  stops: SavedPlace[];
  requestedForSomeoneElse: RequestedForSomeoneElse | null;
  comfortPreferences: ComfortPreferenceId[];
  splitCount: number;
  airportPickup: { terminal: string; pickupPoint: string } | null;
  paymentMethodType: PaymentMethodType;
  cashNoteKz?: number;
}

interface TripContextValue {
  tripDraft: TripDraft;
  activeTrip: TripRequest | null;
  driverLocation: { latitude: number; longitude: number } | null;
  scheduledTrips: TripRequest[];
  setOrigin: (place: SavedPlace) => void;
  setDestination: (place: SavedPlace, distanceKm: number) => void;
  selectCategory: (categoryId: VehicleCategoryId) => void;
  setScheduledFor: (date: Date | null) => void;
  addStop: (place: SavedPlace) => void;
  removeStop: (placeId: string) => void;
  setRequestedForSomeoneElse: (data: RequestedForSomeoneElse | null) => void;
  setComfortPreferences: (prefs: ComfortPreferenceId[]) => void;
  toggleComfortPreference: (id: ComfortPreferenceId) => void;
  setSplitCount: (count: number) => void;
  setAirportPickup: (data: { terminal: string; pickupPoint: string } | null) => void;
  setPaymentMethod: (type: PaymentMethodType, cashNoteKz?: number) => void;
  resetTripDraft: () => void;
  assignDriver: (preferFemaleDriver?: boolean, preferredDriverId?: string) => void;
  assignError: string | null;
  scheduleTrip: (scheduledFor: Date, returnAt?: Date) => TripRequest | null;
  cancelScheduledTrip: (tripId: string) => void;
  refreshScheduled: () => Promise<void>;
  beginRide: () => void;
  completeTrip: (actualDistanceKm?: number, paymentState?: PaymentState) => void;
  cancelTrip: (reason?: string) => Promise<CancellationRisk | undefined>;
  clearActiveTrip: () => void;
}

const INITIAL_DRAFT: TripDraft = {
  origin: defaultOrigin,
  destination: null,
  distanceKm: 0,
  selectedCategoryId: null,
  scheduledFor: null,
  stops: [],
  requestedForSomeoneElse: null,
  comfortPreferences: [],
  splitCount: 1,
  airportPickup: null,
  paymentMethodType: 'wallet',
  cashNoteKz: undefined,
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [tripDraft, setTripDraft] = useState<TripDraft>(INITIAL_DRAFT);
  const [activeTrip, setActiveTrip] = useState<TripRequest | null>(null);
  const [scheduledTrips, setScheduledTrips] = useState<TripRequest[]>([]);
  const { womenModeEnabled } = useSettings();

  const setOrigin: TripContextValue['setOrigin'] = (place) => {
    setTripDraft((prev) => ({ ...prev, origin: place }));
  };

  const setDestination: TripContextValue['setDestination'] = (place, distanceKm) => {
    setTripDraft((prev) => ({ ...prev, destination: place, distanceKm }));
  };

  const selectCategory: TripContextValue['selectCategory'] = (categoryId) => {
    setTripDraft((prev) => ({ ...prev, selectedCategoryId: categoryId }));
  };

  const setScheduledFor: TripContextValue['setScheduledFor'] = (date) => {
    setTripDraft((prev) => ({ ...prev, scheduledFor: date }));
  };

  const addStop: TripContextValue['addStop'] = (place) => {
    setTripDraft((prev) => (prev.stops.some((s) => s.id === place.id) ? prev : { ...prev, stops: [...prev.stops, place] }));
  };

  const removeStop: TripContextValue['removeStop'] = (placeId) => {
    setTripDraft((prev) => ({ ...prev, stops: prev.stops.filter((s) => s.id !== placeId) }));
  };

  const setRequestedForSomeoneElse: TripContextValue['setRequestedForSomeoneElse'] = (data) => {
    setTripDraft((prev) => ({ ...prev, requestedForSomeoneElse: data }));
  };

  const setComfortPreferences: TripContextValue['setComfortPreferences'] = (prefs) => {
    setTripDraft((prev) => ({ ...prev, comfortPreferences: prefs }));
  };

  const toggleComfortPreference: TripContextValue['toggleComfortPreference'] = (id) => {
    setTripDraft((prev) => {
      const has = prev.comfortPreferences.includes(id);
      return {
        ...prev,
        comfortPreferences: has ? prev.comfortPreferences.filter((p) => p !== id) : [...prev.comfortPreferences, id],
      };
    });
  };

  const setSplitCount: TripContextValue['setSplitCount'] = (count) => {
    setTripDraft((prev) => ({ ...prev, splitCount: Math.max(1, Math.floor(count)) }));
  };

  // Airport Mode: terminal e ponto de recolha oficiais.
  const setAirportPickup: TripContextValue['setAirportPickup'] = (data) => {
    setTripDraft((prev) => ({ ...prev, airportPickup: data }));
  };

  // Metodo de pagamento + Troco Inteligente.
  const setPaymentMethod: TripContextValue['setPaymentMethod'] = (type, cashNoteKz) => {
    setTripDraft((prev) => ({ ...prev, paymentMethodType: type, cashNoteKz: type === 'cash' ? cashNoteKz : undefined }));
  };

  const resetTripDraft = () => setTripDraft(INITIAL_DRAFT);

  function buildTripFromDraft(
    draft: TripDraft,
    status: TripRequest['status'],
    driver?: TripRequest['driver']
  ): TripRequest | null {
    if (!draft.destination || !draft.selectedCategoryId) return null;

    const { priceKz, etaMinutes, durationMinutes, breakdown } = estimateTrip(draft.distanceKm, draft.selectedCategoryId);
    const canSplit = draft.selectedCategoryId === 'ango_grupo' || draft.selectedCategoryId === 'ango_family';
    const changeKz = draft.paymentMethodType === 'cash' && draft.cashNoteKz ? computeChangeKz(priceKz, draft.cashNoteKz) : undefined;

    return {
      id: 'trip-' + Date.now(),
      origin: draft.origin,
      destination: draft.destination,
      stops: draft.stops,
      categoryId: draft.selectedCategoryId,
      distanceKm: draft.distanceKm,
      durationMinutes,
      etaMinutes,
      priceKz,
      priceBreakdown: breakdown,
      scheduledFor: draft.scheduledFor?.toISOString(),
      requestedForSomeoneElse: draft.requestedForSomeoneElse ?? undefined,
      comfortPreferences: draft.comfortPreferences.length > 0 ? draft.comfortPreferences : undefined,
      splitCount: canSplit && draft.splitCount > 1 ? draft.splitCount : undefined,
      originalPriceKz: priceKz,
      airportPickup: draft.airportPickup ?? undefined,
      paymentMethodType: draft.paymentMethodType,
      cashNoteKz: draft.paymentMethodType === 'cash' ? draft.cashNoteKz : undefined,
      changeKz,
      status,
      driver: status === 'driver_assigned' ? driver : undefined,
      boardingCode: undefined,
    };
  }

  /**
   * Quando o backend confirma qual motorista real foi atribuido, corrige o motorista
   * mostrado ao passageiro com os dados do servidor (identidade, genero, localizacao e
   * veiculo aprovado). So aplica se a viagem ativa ainda for a mesma.
   */
  const handleRealDriverAssigned = (localTripId: string, assignment: RealDriverAssignment) => {
    setActiveTrip((trip) => {
      if (!trip || trip.id !== localTripId) return trip;
      const realDriver = {
        id: assignment.driver.id,
        fullName: assignment.driver.fullName,
        phone: assignment.driver.phone,
        rating: assignment.driver.rating,
        vehicleModel: assignment.vehicle?.model ?? trip.driver?.vehicleModel ?? 'Veiculo AngoTour',
        vehiclePlate: assignment.vehicle?.plate ?? trip.driver?.vehiclePlate ?? '',
        vehicleColor: assignment.vehicle?.color ?? trip.driver?.vehicleColor ?? '',
        vehicleScore: trip.driver?.vehicleScore,
        gender: (assignment.driver.gender === 'female' ? 'female' : 'male') as 'female' | 'male',
        coordinates: assignment.driverLocation ?? trip.driver?.coordinates ?? trip.origin.coordinates,
      };
      // O codigo gerado localmente (generateBoardingCode) e so um placeholder
      // visual ate aqui. Assim que o servidor confirma a atribuicao real,
      // troca-se pelo codigo que o servidor de facto vai validar - sem isto,
      // um motorista real nunca consegue confirmar o embarque.
      return {
        ...trip,
        driver: realDriver,
        boardingCode: assignment.boardingCode ?? trip.boardingCode,
        remoteId: assignment.remoteId ?? trip.remoteId,
      };
    });
  };

  // AngoTour Ela: com o Modo Mulher ativo, prioriza motorista mulher se houver.
  // Motorista favorito: tenta atribui-lo primeiro se for compativel.
  // A UI responde na hora com um motorista mock; quando o backend confirma o
  // motorista real atribuido, handleRealDriverAssigned corrige os dados.
  const [assignError, setAssignError] = useState<string | null>(null);
  const onAssignFailed = (_localId: string, message: string) => {
    setAssignError(message);
    setActiveTrip(null);
  };

  const assignDriver: TripContextValue['assignDriver'] = (preferFemaleDriver, preferredDriverId) => {
    const preferFemale = preferFemaleDriver ?? womenModeEnabled;
    setAssignError(null);
    setTripDraft((draft) => {
      const trip = buildTripFromDraft(draft, 'searching_driver');
      if (trip) {
        setActiveTrip(trip);
        mirrorCreateAndAssign(trip, preferFemale, handleRealDriverAssigned, onAssignFailed, preferredDriverId);
        recordTripEvent(trip.id, 'trip_created', { distanceKm: trip.distanceKm, priceKz: trip.priceKz }).catch(() => {});
        recordTripEvent(trip.id, 'driver_assigned', { driverId: trip.driver?.id ?? '', womenMode: preferFemale ? 1 : 0 }).catch(() => {});
      }
      return draft;
    });
  };

  const scheduleTrip: TripContextValue['scheduleTrip'] = (scheduledFor, returnAt) => {
    // reserva criada fora do setTripDraft: o retorno e imediato e nao duplica
    const trip = buildTripFromDraft({ ...tripDraft, scheduledFor }, 'searching_driver');
    if (!trip) return null;
    setScheduledTrips((prev) => [trip, ...prev]);
    mirrorCreateScheduled(trip);
    recordTripEvent(trip.id, 'trip_created', { distanceKm: trip.distanceKm, priceKz: trip.priceKz }).catch(() => {});
    // returnTrip: Ida & Volta, segunda reserva com origem e destino trocados (sem paragens)
    if (returnAt && tripDraft.destination) {
      const back = buildTripFromDraft({ ...tripDraft, origin: tripDraft.destination, destination: tripDraft.origin, stops: [], scheduledFor: returnAt }, 'searching_driver');
      if (back) {
        back.id = back.id + '-r';
        setScheduledTrips((prev) => [back, ...prev]);
        mirrorCreateScheduled(back);
        recordTripEvent(back.id, 'trip_created', { distanceKm: back.distanceKm, priceKz: back.priceKz }).catch(() => {});
      }
    }
    return trip;
  };

  // Reservas abertas no servidor (sobrevivem a reiniciar a app).
  const refreshScheduled = async () => {
    try {
      const rows = (await tripsApi.mine()) as any[];
      const open = rows.filter((r) => r.status === 'searching_driver' && r.scheduledFor && new Date(r.scheduledFor).getTime() > Date.now() - 60 * 60 * 1000);
      const known = new Set(scheduledTrips.map((t) => mirrorRemoteId(t.id)));
      const add: TripRequest[] = [];
      for (const r of open) {
        if (known.has(r.id)) continue;
        const localId = 'srv-' + r.id;
        mirrorAdopt(localId, r.id);
        const place = (p: any, tag: string) => ({ id: 'srv-' + tag + '-' + r.id, kind: 'custom', label: String(p?.label || p?.address || ''), address: String(p?.address || p?.label || ''), coordinates: { latitude: Number(p?.latitude), longitude: Number(p?.longitude) } });
        add.push({
          id: localId,
          origin: place(r.origin, 'o'),
          destination: place(r.destination, 'd'),
          stops: (r.stops ?? []).map((s: any, i: number) => place(s, 's' + i)),
          categoryId: r.categoryId,
          distanceKm: Number(r.distanceKm ?? 0),
          durationMinutes: Number(r.durationMinutes ?? 0),
          etaMinutes: Number(r.etaMinutes ?? 0),
          priceKz: Number(r.priceKz ?? 0),
          originalPriceKz: Number(r.priceKz ?? 0),
          scheduledFor: new Date(r.scheduledFor).toISOString(),
          paymentMethodType: r.paymentMethodType ?? 'wallet',
          status: 'searching_driver',
        } as any);
      }
      if (add.length > 0) {
        setScheduledTrips((prev) => [...add.filter((a) => !prev.some((p) => p.id === a.id)), ...prev].sort((a, b) => String(a.scheduledFor).localeCompare(String(b.scheduledFor))));
      }
    } catch {
      // sem rede: mantem o que ja esta na lista
    }
  };

  const cancelScheduledTrip: TripContextValue['cancelScheduledTrip'] = (tripId) => {
    mirrorCancel(tripId, 'Reserva cancelada pelo passageiro');
    setScheduledTrips((prev) => prev.filter((t) => t.id !== tripId));
  };

  const beginRide = () => {
    setActiveTrip((trip) => {
      if (trip) recordTripEvent(trip.id, 'ride_started').catch(() => {});
      if (trip) mirrorStart(trip.id);
      return trip ? { ...trip, status: 'in_progress' } : trip;
    });
  };

  const completeTrip: TripContextValue['completeTrip'] = (actualDistanceKm, paymentState) => {
    setActiveTrip((trip) => {
      if (trip) recordTripEvent(trip.id, 'completed', { priceKz: trip.priceKz }).catch(() => {});
      if (trip) mirrorComplete(trip.id, actualDistanceKm);
      return trip ? { ...trip, status: 'completed', actualDistanceKm, paymentState } : trip;
    });
  };

  /**
   * Cancela a viagem ativa. Com motivo, regista o cancelamento e devolve a
   * classificacao de risco (legitimo / a monitorizar / suspeito). Sem motivo
   * (cancelamento com protecao), nao penaliza o passageiro. Fica sempre no
   * Evidence Vault da viagem.
   */
  const cancelTrip: TripContextValue['cancelTrip'] = async (reason) => {
    let risk: CancellationRisk | undefined;
    if (activeTrip) {
      recordTripEvent(activeTrip.id, 'cancelled', reason ? { reason } : { reason: 'protegido' }).catch(() => {});
      mirrorCancel(activeTrip.id, reason);
    }
    if (reason) {
      risk = await recordCancellation(reason).catch(() => undefined);
    }
    setActiveTrip(null);
    resetTripDraft();
    return risk;
  };

  const clearActiveTrip = () => {
    setActiveTrip(null);
    resetTripDraft();
  };

  // O servidor e a fonte da verdade sobre o estado da viagem: quando o motorista
  // inicia ou conclui, a viagem do passageiro obedece. So ouve viagens que o
  // servidor conhece (remoteId); sem remoteId o fluxo local continua como antes.
  // Tarifas atuais do servidor (editaveis no painel). Sem rede, ficam as locais.
  useEffect(() => {
    syncPricing();
  }, []);

  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const remoteTripId = activeTrip?.remoteId;
  useEffect(() => {
    setDriverLocation(null);
    if (!remoteTripId) return;

    const applyServerStatus = (status: string) => {
      setActiveTrip((trip) => {
        if (!trip || trip.remoteId !== remoteTripId) return trip;
        if (status === 'in_progress' && trip.status !== 'in_progress' && trip.status !== 'completed') {
          recordTripEvent(trip.id, 'ride_started', { source: 'driver' }).catch(() => {});
          return { ...trip, status: 'in_progress' };
        }
        if (status === 'completed' && trip.status !== 'completed') {
          recordTripEvent(trip.id, 'completed', { priceKz: trip.priceKz }).catch(() => {});
          return { ...trip, status: 'completed' };
        }
        if (status === 'cancelled' && trip.status !== 'completed') {
          recordTripEvent(trip.id, 'cancelled', { source: 'driver' }).catch(() => {});
          Alert.alert('Viagem cancelada', 'O motorista cancelou a viagem.');
          return null;
        }
        return trip;
      });
    };

    const syncNow = () => {
      tripLiveRemote.get(remoteTripId).then((t) => applyServerStatus(t.status)).catch(() => {});
    };

    return connectTripSocket(remoteTripId, applyServerStatus, syncNow, setDriverLocation);
  }, [remoteTripId]);

  // Reservas: quando o servidor atribui motorista, a reserva passa a viagem activa.
  useEffect(() => {
    if (activeTrip || scheduledTrips.length === 0) return;
    let alive = true;
    const check = async () => {
      for (const st of scheduledTrips) {
        const remoteId = mirrorRemoteId(st.id);
        if (!remoteId) continue;
        try {
          const t = await tripsApi.get(remoteId);
          if (!alive) return;
          if (t.status === 'cancelled') {
            setScheduledTrips((prev) => prev.filter((x) => x.id !== st.id));
            continue;
          }
          if ((t.status === 'driver_assigned' || t.status === 'driver_arriving') && t.driver) {
            setScheduledTrips((prev) => prev.filter((x) => x.id !== st.id));
            setActiveTrip({ ...st, status: 'driver_assigned', remoteId, boardingCode: t.boardingCode });
            handleRealDriverAssigned(st.id, { driver: t.driver, driverLocation: t.driverLocation ?? null, boardingCode: t.boardingCode, remoteId, vehicle: t.vehicle ?? null });
            Alert.alert('Reserva com motorista', t.driver.fullName + ' vai buscar-te. O codigo de embarque esta na viagem.');
            return;
          }
        } catch {
          // sem rede: tenta no ciclo seguinte
        }
      }
    };
    check();
    const timer = setInterval(check, 10000);
    return () => { alive = false; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledTrips, activeTrip]);

  const value = useMemo(
    () => ({
      tripDraft,
      activeTrip,
      driverLocation,
      scheduledTrips,
      setOrigin,
      setDestination,
      selectCategory,
      setScheduledFor,
      addStop,
      removeStop,
      setRequestedForSomeoneElse,
      setComfortPreferences,
      toggleComfortPreference,
      setSplitCount,
      setAirportPickup,
      setPaymentMethod,
      resetTripDraft,
      assignDriver,
      assignError,
      scheduleTrip,
      cancelScheduledTrip,
      refreshScheduled,
      beginRide,
      completeTrip,
      cancelTrip,
      clearActiveTrip,
    }),
    [tripDraft, activeTrip, driverLocation, scheduledTrips, womenModeEnabled, assignError]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip deve ser usado dentro de um <TripProvider>');
  return ctx;
}






