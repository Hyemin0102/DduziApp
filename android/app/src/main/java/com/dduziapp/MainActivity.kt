package com.dduziapp
import android.os.Bundle;
import com.zoontek.rnbootsplash.RNBootSplash
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.reanimated.ReanimatedPackage

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "dduziApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
      RNBootSplash.init(this, R.style.BootTheme)
      // react-native-screens는 Android가 백그라운드 종료 후 최근 앱에서 화면을 복원할 때
      // 자체 Fragment 상태를 OS가 재구성하는 걸 지원하지 않아 크래시가 남
      // (Screen fragments should never be restored) — 저장된 상태를 넘기지 않아 우회
      // https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
      super.onCreate(null)
  }
}
