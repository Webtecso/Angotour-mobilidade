import React, { createContext, useContext, useMemo, useState } from 'react';
import { ComfortPreferenceId, PaymentMethodType, PaymentState, SavedPlace, TripRequest, VehicleCategoryId } from '../types';
import { chooseDriver, computeChangeKz, defaultOrigin, estimateTrip, generateBoardingCode } from '../services/mockData';
import { CancellationRisk, recordCancellation } from '../services/cancellationStore';
import { recordTripEvent } from '../services/tripEventStore';
import { mirrorCancel, mirrorComplete, mirrorCreateAndAssign, mirrorStart } from '../services/tripMirror';
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
  scheduleTrip: () => TripRequest | null;
  cancelScheduledTrip: (tripId: string) => void;
  beginRide: () => void;
  completeTrip: (actualDistanceKm?: number, paymentState?: PaymentState) => void;
  cancelTrip: (reason?: string) => Promise<CancellationRisk | undefined>;
  updateActiveTripPrice: (newPriceKz: number) => void;
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
      boardingCode: status === 'driver_assigned' ? generateBoardingCode() : undefined,
    };
  }

  // AngoTour Ela: com o Modo Mulher ativo, prioriza motorista mulher se houver.
  // Motorista favorito: tenta atribui-lo primeiro se for compativel.
  const assignDriver: TripContextValue['assignDriver'] = (preferFemaleDriver, preferredDriverId) => {
    const preferFemale = preferFemaleDriver ?? womenModeEnabled;
    const driver = chooseDriver(preferFemale, preferredDriverId);
    setTripDraft((draft) => {
      const trip = buildTripFromDraft(draft, 'driver_assigned', driver);
      if (trip) {
        setActiveTrip(trip);
        mirrorCreateAndAssign(trip, preferFemale);
        recordTripEvent(trip.id, 'trip_created', { distanceKm: trip.distanceKm, priceKz: trip.priceKz }).catch(() => {});
        recordTripEvent(trip.id, 'driver_assigned', { driverId: trip.driver?.id ?? '', womenMode: preferFemale ? 1 : 0 }).catch(() => {});
      }
      return draft;
    });
  };

  const scheduleTrip: TripContextValue['scheduleTrip'] = () => {
    let created: TripRequest | null = null;
    setTripDraft((draft) => {
      const trip = buildTripFromDraft(draft, 'searching_driver');
      if (trip) {
        created = trip;
        setScheduledTrips((prev) => [trip, ...prev]);
        recordTripEvent(trip.id, 'trip_created', { distanceKm: trip.distanceKm, priceKz: trip.priceKz }).catch(() => {});
      }
      return draft;
    });
    return created;
  };

  const cancelScheduledTrip: TripContextValue['cancelScheduledTrip'] = (tripId) => {
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

  const updateActiveTripPrice: TripContextValue['updateActiveTripPrice'] = (newPriceKz) => {
    setActiveTrip((trip) => (trip ? { ...trip, priceKz: newPriceKz } : trip));
  };

  const clearActiveTrip = () => {
    setActiveTrip(null);
    resetTripDraft();
  };

  const value = useMemo(
    () => ({
      tripDraft,
      activeTrip,
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
      scheduleTrip,
      cancelScheduledTrip,
      beginRide,
      completeTrip,
      cancelTrip,
      updateActiveTripPrice,
      clearActiveTrip,
    }),
    [tripDraft, activeTrip, scheduledTrips, womenModeEnabled]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip deve ser usado dentro de um <TripProvider>');
  return ctx;
}


