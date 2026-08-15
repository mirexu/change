import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import { setLocale, type Locale } from './i18n'
import { GetLocale } from '../wailsjs/go/main/App'

async function bootstrap(): Promise<void> {
  let l: Locale = 'zh'
  try {
    const saved = await GetLocale()
    l = saved === 'en' ? 'en' : 'zh'
  } catch {
    /* ignore */
  }
  setLocale(l)
  createApp(App)
    .use(ElementPlus, { locale: l === 'en' ? en : zhCn })
    .mount('#app')
}

void bootstrap()
