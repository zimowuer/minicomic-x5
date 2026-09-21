// Copyright (C) 2025 Langning Chen
// 
// This file is part of miniapp.
// 
// miniapp is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// miniapp is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with miniapp.  If not, see <https://www.gnu.org/licenses/>.

import { BasePage } from './base-page.js'
class App extends $falcon.App {
  /**
   * 鏋勯€犲嚱鏁?搴旂敤鐢熷懡鍛ㄦ湡鍐呭彧鏋勯€犱竴娆?
   */
  constructor() {
    super()
  }

  /**
   * 搴旂敤鐢熷懡鍛ㄦ湡:搴旂敤鍚姩. 鍒濆鍖栧畬鎴愭椂鍥炶皟,鍏ㄥ眬鍙Е鍙戜竴娆?
   * @param {Object} options 鍚姩鍙傛暟
   */
  onLaunch(options) {
    super.onLaunch(options)
    // 灞忓箷鍒嗚鲸鐜囬€傞厤: viewport璁句负900, 鍦?00px灞忓箷涓婃暣浣撶缉灏忚嚦800/900鈮?.89
    // 浣垮崱鐗囥€侀敭鐩樼瓑鍐呭瀹屾暣鏄剧ず涓嶈秴鍑哄睆骞?
    this.setViewPort(900)

    // 璁剧疆椤甸潰鍩虹被,搴旂敤鍏ㄥ眬鐨?falcon.Page灏嗚鏇挎崲鎴愭澶勬寚瀹氱殑BasePage.
    // 缁ф壙鑷?falcon.Page鐨勯〉闈㈠皢缁ф壙鑷敼鍩虹被.
    // 濡傞〉闈㈡湭鎸囧畾js,鐩存帴鎸囧悜.vue鏂囦欢,椤甸潰鍒涘缓鏃朵細榛樿鍒涘缓璇ョ被鐨勫疄渚?
    $falcon.useDefaultBasePageClass(BasePage)
  }

  /**
   * 搴旂敤鐢熷懡鍛ㄦ湡,搴旂敤鍚姩鎴栧簲鐢ㄤ粠鍚庡彴鍒囨崲鍒板墠鍙版椂瑙﹀彂
   */
  onShow() {
    super.onShow()
  }

  /**
   * 搴旂敤鐢熷懡鍛ㄦ湡:搴旂敤閫€鍑哄墠鎴栬€呭簲鐢ㄤ粠鍓嶅彴鍒囨崲鍒板悗鍙版椂瑙﹀彂
   */
  onHide() {
    super.onHide()
  }

  /**
   * 搴旂敤鐢熷懡鍛ㄦ湡:搴旂敤閿€姣佸墠瑙﹀彂
   */
  onDestroy() {
    super.onDestroy()
  }
}

try {
  globalThis['window'] = {
    requestAnimationFrame,
    cancelAnimationFrame
  }
} catch (err) {
  console.log(err)
}

try {
  globalThis['process'] = {
    env: {
      NODE_ENV: 'production'
    }
  }
} catch (err) {
  console.log(err)
}

export default App
