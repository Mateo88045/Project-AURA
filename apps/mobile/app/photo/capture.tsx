import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, X, RefreshCw, Send } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { Colors } from '@aura/shared/constants/colors';
import { AmbientOrbs } from '../../components/ui/AmbientOrbs';
import { AuraButton } from '../../components/ui/AuraButton';
import { useToast } from '../../components/ui/AuraToast';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { triggerPhotoIngest } from '../../services/jobs';

export default function PhotoCapture() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { data: user } = useCurrentUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 24, paddingHorizontal: 28 }]}>
        <AmbientOrbs />
        <Pressable onPress={() => router.back()} style={styles.close} accessibilityLabel="Close">
          <X color={Colors.textSecondary} size={20} />
        </Pressable>
        <View style={styles.permissionBody}>
          <View style={styles.permissionIcon}>
            <Camera color={Colors.mist} size={28} strokeWidth={1.6} />
          </View>
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionBlurb}>
            Aura uses the camera to read your assignments off paper handouts.
            Photos are sent to Aura's secure backend and aren't kept on your device.
          </Text>
          <View style={{ marginTop: 24, gap: 10 }}>
            <AuraButton
              label="Allow camera"
              onPress={requestPermission}
              variant="primary"
              size="lg"
              fullWidth
            />
            <AuraButton label="Not now" onPress={() => router.back()} variant="ghost" fullWidth />
          </View>
        </View>
      </View>
    );
  }

  const capture = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      if (result?.base64) setPhotoBase64(result.base64);
      if (result?.uri) setPhotoUri(result.uri);
    } catch {
      toast.show('Couldn\'t capture that. Try again.', 'error');
    }
  };

  const retake = () => {
    setPhotoBase64(null);
    setPhotoUri(null);
  };

  const submit = async () => {
    if (!photoBase64 || !user) return;
    setSending(true);
    try {
      await triggerPhotoIngest(user.id, photoBase64);
      toast.show('Photo sent. Aura is reading it now.', 'success');
      router.back();
    } catch {
      toast.show('Upload failed. Try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.root}>
      {photoBase64 && photoUri ? (
        <View style={styles.preview}>
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="contain" />
        </View>
      ) : (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.close} accessibilityLabel="Close">
          <X color={Colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.hint}>
          {photoBase64 ? 'Looks right?' : 'Fill the frame with the assignment.'}
        </Text>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        {photoBase64 ? (
          <>
            <Pressable
              onPress={retake}
              accessibilityLabel="Retake"
              style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.7 }]}
            >
              <RefreshCw color={Colors.textPrimary} size={20} />
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={sending}
              accessibilityLabel="Send to Aura"
              style={({ pressed }) => [
                styles.send,
                sending && { opacity: 0.5 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Send color={Colors.bgDark} size={22} />
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={capture}
            accessibilityLabel="Take photo"
            style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.96 }] }]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  preview: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  hint: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.textPrimary,
  },
  secondary: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  send: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBody: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  permissionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(168,218,220,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  permissionBlurb: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
  },
});
