<template>
  <div id="app-root">
    <header>
      <img src="/favicon.ico" alt="App icon" class="logo" />
      <h1>Vue + Electron App</h1>
    </header>
    <main>
      <HelloWorld />
    </main>
  </div>
</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue';
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #1a1a2e;
  color: #e0e0e0;
}

#app-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

header h1 {
  font-size: 2rem;
  color: #42b883;
}

.logo {
  width: 48px;
  height: 48px;
}
</style>
