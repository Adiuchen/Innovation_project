import { useEffect, useState } from "react";
import { Keyboard, LayoutAnimation, Platform } from "react-native";

export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === "android") return;

    function update(next: number) {
      if (Platform.OS === "ios") LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setHeight(next);
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (event) => update(event.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => update(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
