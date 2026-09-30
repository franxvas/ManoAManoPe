import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { demoCategories } from '@/constants/demo';
import { colors, listingLabels } from '@/constants/theme';
import {
  useDeviceLocation,
  type DeviceCoordinates,
} from '@/features/location/location-provider';
import { useAuth } from '@/features/auth/auth-provider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useProfile } from '@/hooks/use-profile';
import {
  createRemoteListing,
  fetchCategories,
  fetchListing,
  updateRemoteListing,
  type ListingWriteInput,
} from '@/services/listings';
import { useAppStore } from '@/stores/app-store';
import type { Listing, ListingType } from '@/types/domain';

const schema = z.object({
  title: z
    .string()
    .min(5, 'Escribe un título más descriptivo')
    .max(100),

  categoryId: z
    .string()
    .min(1, 'Elige una categoría'),

  description: z
    .string()
    .min(20, 'Describe mejor lo que publicas')
    .max(2000),

  price: z.string(),
  originalPrice: z.string(),
  condition: z.string(),

  address: z
    .string()
    .min(3, 'Ingresa una ubicación'),

  city: z
    .string()
    .min(2),

  region: z
    .string()
    .min(2),

  serviceArea: z.string(),
  availability: z.string(),
  validUntil: z.string(),
  negotiable: z.boolean(),
  homeService: z.boolean(),
  shippingAvailable: z.boolean(),
});

type Values = z.infer<typeof schema>;

export default function PublishFormScreen() {
  const {
    type: rawType,
    listingId,
  } = useLocalSearchParams<{
    type?: string;
    listingId?: string;
  }>();

  const { isAuthenticated } = useAuth();

  const validType =
    rawType &&
    ['product', 'service', 'promotion', 'need'].includes(rawType);

  const type = validType
    ? (rawType as ListingType)
    : null;

  const localExisting = useAppStore((state) =>
    state.listings.find((item) => item.id === listingId)
  );

  const remoteExisting = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => fetchListing(listingId!),
    enabled:
      isSupabaseConfigured &&
      Boolean(listingId),
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        edges={['top']}
        className="flex-1 bg-canvas"
      >
        <ScreenHeader
          title="Publicar"
          showBack
        />

        <View className="flex-1 justify-center px-6">
          <EmptyState
            icon="lock-closed-outline"
            title="Inicia sesión para publicar"
            description="Necesitas una cuenta para crear o editar publicaciones."
          />

          <PrimaryButton
            label="Iniciar sesión"
            onPress={() =>
              router.replace({
                pathname: '/(auth)/login',
                params: {
                  returnTo: '/(tabs)/publish',
                },
              })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!type) {
    return (
      <SafeAreaView
        edges={['top']}
        className="flex-1 bg-canvas"
      >
        <ScreenHeader
          title="Publicar"
          showBack
        />

        <EmptyState
          icon="alert-circle-outline"
          title="Tipo de publicación inválido"
          description="Vuelve a elegir qué deseas publicar."
        />
      </SafeAreaView>
    );
  }

  if (
    isSupabaseConfigured &&
    listingId &&
    remoteExisting.isLoading
  ) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        <Text className="font-medium text-navy">
          Cargando publicación…
        </Text>
      </SafeAreaView>
    );
  }

  if (
    listingId &&
    (
      remoteExisting.isError ||
      (
        isSupabaseConfigured
          ? remoteExisting.data === null
          : !localExisting
      )
    )
  ) {
    return (
      <SafeAreaView
        edges={['top']}
        className="flex-1 bg-canvas"
      >
        <ScreenHeader
          title="Editar publicación"
          showBack
          backFallback="/(tabs)/profile"
        />

        <EmptyState
          icon="alert-circle-outline"
          title="Publicación no disponible"
          description="No se encontró o ya no tienes acceso para editarla."
        />
      </SafeAreaView>
    );
  }

  return (
    <PublishFormContent
      type={type}
      existing={
        isSupabaseConfigured
          ? (remoteExisting.data ?? undefined)
          : localExisting
      }
    />
  );
}

function PublishFormContent({
  type,
  existing,
}: {
  type: ListingType;
  existing?: Listing;
}) {
  const queryClient = useQueryClient();

  const localProfile = useAppStore(
    (state) => state.profile
  );

  const { profile: remoteProfile } = useProfile();

  const profile =
    remoteProfile ?? localProfile;

  const addListing = useAppStore(
    (state) => state.addListing
  );

  const updateListing = useAppStore(
    (state) => state.updateListing
  );

  const [photos, setPhotos] =
    useState<string[]>(
      existing?.images ?? []
    );

  const [
    listingCoordinates,
    setListingCoordinates,
  ] = useState<DeviceCoordinates | null>(
    existing
      ? {
          latitude: existing.latitude,
          longitude: existing.longitude,
        }
      : null
  );

  const [submitError, setSubmitError] =
    useState('');

  const [progress, setProgress] =
    useState('');

  const {
    coordinates: deviceCoordinates,
    permissionStatus,
    canAskAgain,
    requestLocation,
    openLocationSettings,
  } = useDeviceLocation();

  const remoteCategories = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: isSupabaseConfigured,
  });

  const categories = (
    isSupabaseConfigured
      ? (remoteCategories.data ?? [])
      : demoCategories
  ).filter(
    (item) => item.type === type
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<Values>({
    resolver: zodResolver(schema),

    defaultValues: {
      title:
        existing?.title ?? '',

      categoryId:
        existing?.categoryId ?? '',

      description:
        existing?.description ?? '',

      price: String(
        existing?.price ??
        existing?.budget ??
        ''
      ),

      originalPrice: String(
        existing?.originalPrice ?? ''
      ),

      condition:
        existing?.condition ?? '',

      address:
        existing?.address ?? '',

      city:
        existing?.city ??
        profile.city,

      region:
        existing?.region ??
        profile.region,

      serviceArea:
        existing?.serviceArea ??
        profile.serviceArea ??
        '',

      availability:
        existing?.availability ??
        profile.availability ??
        '',

      validUntil:
        existing?.validUntil ?? '',

      negotiable:
        existing?.negotiable ?? false,

      homeService:
        existing?.homeService ?? false,

      shippingAvailable:
        existing?.shippingAvailable ?? false,
    },
  });

  const selectedCategoryId =
    useWatch({
      control,
      name: 'categoryId',
    });

  useEffect(() => {
    if (existing) return;

    void requestLocation();
  }, [
    existing,
    requestLocation,
  ]);

  const effectiveCoordinates =
    listingCoordinates ??
    (
      !existing
        ? deviceCoordinates
        : null
    );

  const pickPhotos = async () => {
    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return setSubmitError(
        'Permite el acceso a tus fotos para poder añadirlas.'
      );
    }

    const result =
      await ImagePicker
        .launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          selectionLimit: Math.max(
            1,
            6 - photos.length
          ),
          quality: 0.8,
        });

    if (!result.canceled) {
      setPhotos((current) =>
        [
          ...current,
          ...result.assets.map(
            (asset) => asset.uri
          ),
        ].slice(0, 6)
      );
    }
  };

  const takePhoto = async () => {
    const permission =
      await ImagePicker
        .requestCameraPermissionsAsync();

    if (!permission.granted) {
      return setSubmitError(
        'Permite el acceso a la cámara para tomar una foto.'
      );
    }

    const result =
      await ImagePicker
        .launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });

    if (
      !result.canceled &&
      result.assets[0]
    ) {
      setPhotos((current) =>
        [
          ...current,
          result.assets[0]!.uri,
        ].slice(0, 6)
      );
    }
  };

  const choosePhotoSource = () => {
    if (Platform.OS === 'web') {
      return void pickPhotos();
    }

    Alert.alert(
      'Añadir foto',
      'Elige el origen',
      [
        {
          text: 'Cámara',
          onPress: () =>
            void takePhoto(),
        },
        {
          text: 'Galería',
          onPress: () =>
            void pickPhotos(),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const selectCurrentLocation =
    async () => {
      const current =
        await requestLocation();

      if (!current) {
        setSubmitError(
          'Activa el permiso de ubicación para publicar en la zona correcta.'
        );

        if (!canAskAgain) {
          await openLocationSettings();
        }

        return;
      }

      setListingCoordinates(current);
      setSubmitError('');

      try {
        const [place] =
          await Location
            .reverseGeocodeAsync(
              current
            );

        if (place) {
          const address = [
            place.street,
            place.name,
            place.district,
          ]
            .filter(Boolean)
            .filter(
              (
                value,
                index,
                items
              ) =>
                items.indexOf(
                  value
                ) === index
            )
            .join(', ');

          if (address) {
            setValue(
              'address',
              address,
              {
                shouldValidate: true,
              }
            );
          }

          if (
            place.city ||
            place.subregion
          ) {
            setValue(
              'city',
              place.city ??
                place.subregion ??
                '',
              {
                shouldValidate: true,
              }
            );
          }

          if (place.region) {
            setValue(
              'region',
              place.region,
              {
                shouldValidate: true,
              }
            );
          }
        }
      } catch {
        setValue(
          'address',
          `${current.latitude.toFixed(
            5
          )}, ${current.longitude.toFixed(
            5
          )}`,
          {
            shouldValidate: true,
          }
        );
      }
    };

  const submit =
    handleSubmit(
      async (values) => {
        setSubmitError('');

        if (
          photos.length === 0
        ) {
          return setSubmitError(
            'Añade al menos una foto para la publicación.'
          );
        }

        if (
          remoteCategories.isError ||
          categories.length === 0
        ) {
          return setSubmitError(
            'No pudimos cargar las categorías. Revisa tu conexión e inténtalo otra vez.'
          );
        }

        if (
          type !== 'need' &&
          !values.price
        ) {
          return setSubmitError(
            'Ingresa un precio para publicar.'
          );
        }

        // NUEVA VALIDACIÓN:
        // Un producto debe indicar su estado o condición.
        if (
          type === 'product' &&
          !values.condition.trim()
        ) {
          return setSubmitError(
            'Indica el estado o condición del producto.'
          );
        }

        if (
          type === 'promotion' &&
          !values.originalPrice
        ) {
          return setSubmitError(
            'Ingresa el precio normal de la promoción.'
          );
        }

        const parsedPrice =
          values.price
            ? Number(
                values.price.replace(
                  ',',
                  '.'
                )
              )
            : undefined;

        const parsedOriginal =
          values.originalPrice
            ? Number(
                values.originalPrice.replace(
                  ',',
                  '.'
                )
              )
            : undefined;

        if (
          (
            parsedPrice != null &&
            (
              !Number.isFinite(
                parsedPrice
              ) ||
              parsedPrice < 0
            )
          ) ||
          (
            parsedOriginal != null &&
            (
              !Number.isFinite(
                parsedOriginal
              ) ||
              parsedOriginal < 0
            )
          )
        ) {
          return setSubmitError(
            'Revisa los montos ingresados.'
          );
        }

        if (
          type === 'promotion' &&
          parsedPrice != null &&
          parsedOriginal != null &&
          parsedOriginal <
            parsedPrice
        ) {
          return setSubmitError(
            'El precio normal debe ser mayor o igual al precio promocional.'
          );
        }

        if (
          type === 'promotion' &&
          values.validUntil &&
          !/^\d{4}-\d{2}-\d{2}$/.test(
            values.validUntil
          )
        ) {
          return setSubmitError(
            'Escribe la vigencia con el formato AAAA-MM-DD.'
          );
        }

        const currentCoordinates =
          existing
            ? listingCoordinates
            : await requestLocation();

        if (
          !currentCoordinates
        ) {
          return setSubmitError(
            'No se puede publicar sin una ubicación real. Activa el permiso de ubicación e inténtalo otra vez.'
          );
        }

        setListingCoordinates(
          currentCoordinates
        );

        const write:
          ListingWriteInput = {
          categoryId:
            values.categoryId,

          type,

          title:
            values.title.trim(),

          description:
            values.description.trim(),

          price:
            type === 'need'
              ? undefined
              : parsedPrice,

          budget:
            type === 'need'
              ? parsedPrice
              : undefined,

          originalPrice:
            parsedOriginal,

          negotiable:
            values.negotiable,

          condition:
            values.condition ||
            undefined,

          serviceArea:
            values.serviceArea ||
            undefined,

          availability:
            values.availability ||
            undefined,

          homeService:
            values.homeService,

          shippingAvailable:
            values.shippingAvailable,

          validUntil:
            values.validUntil ||
            undefined,

          address:
            values.address.trim(),

          city:
            values.city.trim(),

          region:
            values.region.trim(),

          latitude:
            currentCoordinates.latitude,

          longitude:
            currentCoordinates.longitude,
        };

        try {
          if (existing) {
            if (
              isSupabaseConfigured
            ) {
              await updateRemoteListing(
                existing.id,
                write,
                photos
              );
            } else {
              updateListing(
                existing.id,
                {
                  ...write,
                  currency: 'PEN',
                  images: photos,
                }
              );
            }

            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: [
                  'listing',
                  existing.id,
                ],
              }),
              queryClient.invalidateQueries({
                queryKey: [
                  'listings',
                ],
              }),
              queryClient.invalidateQueries({
                queryKey: [
                  'my-listings',
                ],
              }),
            ]);

            router.replace(
              '/profile/my-listings'
            );
          } else if (
            isSupabaseConfigured
          ) {
            setProgress(
              'Subiendo fotos y guardando publicación...'
            );

            const id =
              await createRemoteListing(
                write,
                photos
              );

            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: [
                  'listings',
                ],
              }),
              queryClient.invalidateQueries({
                queryKey: [
                  'my-listings',
                ],
              }),
            ]);

            router.replace({
              pathname:
                '/listing/[id]',
              params: {
                id,
              },
            });
          } else {
            const listing =
              addListing({
                ...write,
                currency: 'PEN',
                images: photos,
              });

            router.replace({
              pathname:
                '/listing/[id]',
              params: {
                id: listing.id,
              },
            });
          }
        } catch (error) {
          setProgress('');

          setSubmitError(
            error instanceof Error
              ? error.message
              : 'No se pudo guardar la publicación.'
          );
        }
      }
    );

  const title = existing
    ? `Editar ${listingLabels[type]}`
    : `Publicar Nuevo ${listingLabels[type]}`;

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1 bg-canvas"
    >
      <ScreenHeader
        title={title}
        showBack
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerClassName="px-5 pb-12 pt-5"
          keyboardShouldPersistTaps="handled"
        >
          <Section
            title="Fotos"
            subtitle={`${photos.length}/6 · La primera será la portada`}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerClassName="gap-3"
            >
              {photos.map(
                (
                  uri,
                  index
                ) => (
                  <View
                    key={`${uri}-${index}`}
                    className="relative"
                  >
                    <Image
                      source={{
                        uri,
                      }}
                      className="h-24 w-24 rounded-2xl"
                      contentFit="cover"
                    />

                    <Pressable
                      onPress={() =>
                        setPhotos(
                          (
                            items
                          ) =>
                            items.filter(
                              (
                                _,
                                itemIndex
                              ) =>
                                itemIndex !==
                                index
                            )
                        )
                      }
                      className="absolute -right-1 -top-1 h-7 w-7 items-center justify-center rounded-full bg-brand"
                    >
                      <Ionicons
                        name="close"
                        size={17}
                        color="white"
                      />
                    </Pressable>
                  </View>
                )
              )}

              {photos.length <
                6 && (
                <Pressable
                  onPress={
                    choosePhotoSource
                  }
                  className="h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-navy bg-white"
                >
                  <Ionicons
                    name="add"
                    size={26}
                    color={
                      colors.navy
                    }
                  />

                  <Text className="mt-1 font-medium text-[10px] text-navy">
                    Añadir foto
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </Section>

          <Section
            title={`Datos del ${listingLabels[
              type
            ].toLocaleLowerCase(
              'es-PE'
            )}`}
          >
            <Controller
              control={control}
              name="title"
              render={({
                field,
              }) => (
                <FormField
                  label="Título"
                  placeholder={
                    type ===
                    'service'
                      ? 'Ej. Muebles a medida'
                      : 'Describe lo que publicas'
                  }
                  value={
                    field.value
                  }
                  onChangeText={
                    field.onChange
                  }
                  error={
                    errors.title
                      ?.message
                  }
                />
              )}
            />

            <Text className="mb-2 font-medium text-sm text-ink">
              Categoría
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerClassName="gap-2 pb-4"
            >
              {categories.map(
                (category) => {
                  const active =
                    selectedCategoryId ===
                    category.id;

                  return (
                    <Pressable
                      key={
                        category.id
                      }
                      onPress={() =>
                        setValue(
                          'categoryId',
                          category.id,
                          {
                            shouldValidate:
                              true,
                          }
                        )
                      }
                      className={`rounded-full border px-4 py-2.5 ${
                        active
                          ? 'border-brand bg-brand'
                          : 'border-line bg-white'
                      }`}
                    >
                      <Text
                        className={`font-medium text-xs ${
                          active
                            ? 'text-white'
                            : 'text-navy'
                        }`}
                      >
                        {
                          category.name
                        }
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </ScrollView>

            {errors.categoryId
              ?.message && (
              <Text className="mb-3 text-xs text-brand">
                {
                  errors
                    .categoryId
                    .message
                }
              </Text>
            )}

            <Controller
              control={control}
              name="description"
              render={({
                field,
              }) => (
                <FormField
                  label="Descripción detallada"
                  multiline
                  placeholder="Incluye detalles útiles para la otra persona..."
                  value={
                    field.value
                  }
                  onChangeText={
                    field.onChange
                  }
                  error={
                    errors
                      .description
                      ?.message
                  }
                />
              )}
            />

            {type ===
              'promotion' && (
              <Controller
                control={
                  control
                }
                name="originalPrice"
                render={({
                  field,
                }) => (
                  <FormField
                    label="Precio normal (S/)"
                    keyboardType="decimal-pad"
                    value={
                      field.value
                    }
                    onChangeText={
                      field.onChange
                    }
                  />
                )}
              />
            )}

            <Controller
              control={control}
              name="price"
              render={({
                field,
              }) => (
                <FormField
                  label={
                    type ===
                    'need'
                      ? 'Presupuesto opcional (S/)'
                      : type ===
                          'service'
                        ? 'Precio desde (S/)'
                        : type ===
                            'promotion'
                          ? 'Precio promocional (S/)'
                          : 'Precio (S/)'
                  }
                  keyboardType="decimal-pad"
                  value={
                    field.value
                  }
                  onChangeText={
                    field.onChange
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="negotiable"
              render={({
                field,
              }) => (
                <Toggle
                  label={
                    type ===
                    'need'
                      ? 'Presupuesto negociable'
                      : 'Precio negociable'
                  }
                  value={
                    field.value
                  }
                  onValueChange={
                    field.onChange
                  }
                />
              )}
            />

            {type ===
              'product' && (
              <Controller
                control={
                  control
                }
                name="condition"
                render={({
                  field,
                }) => (
                  <FormField
                    label="Estado o condición"
                    placeholder="Nuevo, como nuevo, usado..."
                    value={
                      field.value
                    }
                    onChangeText={
                      field.onChange
                    }
                  />
                )}
              />
            )}

            {type ===
              'promotion' && (
              <Controller
                control={
                  control
                }
                name="validUntil"
                render={({
                  field,
                }) => (
                  <FormField
                    label="Vigencia"
                    placeholder="AAAA-MM-DD"
                    value={
                      field.value
                    }
                    onChangeText={
                      field.onChange
                    }
                  />
                )}
              />
            )}
          </Section>

          {(type ===
            'service' ||
            type ===
              'promotion') && (
            <Section title="Proveedor">
              <View className="flex-row items-center rounded-2xl bg-canvas p-3">
                <Avatar
                  uri={
                    profile.avatarUrl
                  }
                  name={
                    profile.displayName
                  }
                  size={54}
                />

                <View className="ml-3 flex-1">
                  <Text className="font-display text-lg text-navy">
                    {
                      profile.displayName
                    }
                  </Text>

                  <Text className="font-sans text-xs text-muted">
                    {
                      profile.profession
                    }
                  </Text>

                  <Text className="mt-1 font-medium text-xs text-rating">
                    ★{' '}
                    {profile.ratingAverage.toFixed(
                      1
                    )}{' '}
                    ·{' '}
                    {
                      profile.ratingCount
                    }{' '}
                    reseñas
                  </Text>
                </View>

                {profile.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={21}
                    color={
                      colors.navy
                    }
                  />
                )}
              </View>
            </Section>
          )}

          <Section title="Ubicación y entrega">
            <Controller
              control={control}
              name="address"
              render={({
                field,
              }) => (
                <FormField
                  label="Dirección o referencia"
                  value={
                    field.value
                  }
                  onChangeText={
                    field.onChange
                  }
                  error={
                    errors.address
                      ?.message
                  }
                />
              )}
            />

            <Pressable
              onPress={() =>
                void selectCurrentLocation()
              }
              className="mb-4 flex-row items-center self-start rounded-full bg-blue-50 px-4 py-2"
            >
              <Ionicons
                name="locate-outline"
                size={17}
                color={
                  colors.navy
                }
              />

              <Text className="ml-2 font-medium text-xs text-navy">
                Usar mi ubicación
                actual
              </Text>
            </Pressable>

            {effectiveCoordinates ? (
              <View className="mb-4 flex-row items-center rounded-2xl bg-green-50 p-3">
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={
                    colors.success
                  }
                />

                <Text className="ml-2 flex-1 font-sans text-xs text-green-800">
                  Ubicación
                  verificada. La
                  publicación
                  aparecerá cerca de
                  esta zona.
                </Text>
              </View>
            ) : permissionStatus ===
              Location
                .PermissionStatus
                .DENIED ? (
              <Pressable
                onPress={() =>
                  void (
                    canAskAgain
                      ? selectCurrentLocation()
                      : openLocationSettings()
                  )
                }
                className="mb-4 flex-row items-center rounded-2xl bg-red-50 p-3"
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={
                    colors.red
                  }
                />

                <Text className="ml-2 flex-1 font-sans text-xs text-brand">
                  Debes activar la
                  ubicación para
                  publicar en tu
                  zona.
                </Text>
              </Pressable>
            ) : null}

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={
                    control
                  }
                  name="city"
                  render={({
                    field,
                  }) => (
                    <FormField
                      label="Ciudad"
                      value={
                        field.value
                      }
                      onChangeText={
                        field.onChange
                      }
                      error={
                        errors.city
                          ?.message
                      }
                    />
                  )}
                />
              </View>

              <View className="flex-1">
                <Controller
                  control={
                    control
                  }
                  name="region"
                  render={({
                    field,
                  }) => (
                    <FormField
                      label="Región"
                      value={
                        field.value
                      }
                      onChangeText={
                        field.onChange
                      }
                      error={
                        errors
                          .region
                          ?.message
                      }
                    />
                  )}
                />
              </View>
            </View>

            {type ===
              'service' && (
              <>
                <Controller
                  control={
                    control
                  }
                  name="serviceArea"
                  render={({
                    field,
                  }) => (
                    <FormField
                      label="Zona de atención"
                      value={
                        field.value
                      }
                      onChangeText={
                        field.onChange
                      }
                    />
                  )}
                />

                <Controller
                  control={
                    control
                  }
                  name="availability"
                  render={({
                    field,
                  }) => (
                    <FormField
                      label="Disponibilidad"
                      value={
                        field.value
                      }
                      onChangeText={
                        field.onChange
                      }
                    />
                  )}
                />

                <Controller
                  control={
                    control
                  }
                  name="homeService"
                  render={({
                    field,
                  }) => (
                    <Toggle
                      label="Atención a domicilio"
                      value={
                        field.value
                      }
                      onValueChange={
                        field.onChange
                      }
                    />
                  )}
                />
              </>
            )}

            {(type ===
              'product' ||
              type ===
                'promotion') && (
              <Controller
                control={
                  control
                }
                name="shippingAvailable"
                render={({
                  field,
                }) => (
                  <Toggle
                    label="Envío disponible"
                    value={
                      field.value
                    }
                    onValueChange={
                      field.onChange
                    }
                  />
                )}
              />
            )}
          </Section>

          {Boolean(
            submitError
          ) && (
            <Text className="mb-4 rounded-xl bg-red-50 p-3 font-sans text-sm text-brand">
              {submitError}
            </Text>
          )}

          {Boolean(
            progress
          ) && (
            <Text className="mb-3 text-center font-medium text-sm text-navy">
              {progress}
            </Text>
          )}

          <PrimaryButton
            label={
              existing
                ? 'Guardar cambios'
                : `Publicar ${listingLabels[type]}`
            }
            loading={
              isSubmitting
            }
            onPress={submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-5 rounded-3xl bg-white p-5">
      <View className="mb-4">
        <Text className="font-display text-xl text-navy">
          {title}
        </Text>

        {Boolean(
          subtitle
        ) && (
          <Text className="mt-1 font-sans text-xs text-muted">
            {subtitle}
          </Text>
        )}
      </View>

      {children}
    </View>
  );
}

function Toggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (
    value: boolean
  ) => void;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-canvas px-4 py-3">
      <Text className="font-medium text-sm text-ink">
        {label}
      </Text>

      <Switch
        value={value}
        onValueChange={
          onValueChange
        }
        trackColor={{
          false: '#D1D5DB',
          true: colors.red,
        }}
      />
    </View>
  );
}