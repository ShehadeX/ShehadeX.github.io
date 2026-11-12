<script setup lang="ts">
import { RouterLink } from 'vue-router'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-24 border-t border-ink/10">
    <div
      class="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <p class="term inline-block px-3 py-2">$ echo "stay curious" — exit 0</p>
        <p class="mt-4 text-[13px] leading-relaxed text-ink-muted">
          肖致浩 · AI Engineering<br />
          广东工业大学 · 计算机科学与技术 · 2028 届
        </p>
      </div>

      <div class="flex flex-col gap-2 text-[13px] text-ink-muted">
        <a class="ul w-fit" href="mailto:2912698300@qq.com">2912698300@qq.com</a>
        <a class="ul w-fit" href="https://github.com/ShehadeX" target="_blank" rel="noopener">
          github.com/ShehadeX
        </a>
        <a class="ul w-fit" href="tel:13728860925">13728860925</a>
        <RouterLink class="ul w-fit" to="/research">Dissecting the Score — ICLR 2027</RouterLink>
        <span class="text-ink-faint">© {{ year }} 肖致浩</span>
      </div>
    </div>
  </footer>
</template>
