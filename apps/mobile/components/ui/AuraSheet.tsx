import { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Colors } from '@aura/shared/constants/colors';
import { Layout } from '@aura/shared/constants/layout';

interface AuraSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function AuraSheet({ visible, onClose, children }: AuraSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
      />
      <View
        className="px-[28px] pt-4 pb-8"
        style={{
          backgroundColor: Colors.bgDark,
          borderTopLeftRadius: Layout.radiusHero,
          borderTopRightRadius: Layout.radiusHero,
          borderColor: Colors.mist,
          borderTopWidth: 0.5,
        }}
      >
        {children}
      </View>
    </Modal>
  );
}

