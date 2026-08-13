import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import { setLocale, type Locale } from './i18n'

async function bootstrap(): Promise<void> {
  const saved = await window.api.getLocale()
  const l: Locale = saved === 'en' ? 'en' : 'zh'
  setLocale(l)
  createApp(App)
    .use(ElementPlus, { locale: l === 'en' ? en : zhCn })
    .mount('#app')
}

void bootstrap()
