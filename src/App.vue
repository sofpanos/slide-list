<template>
  <div id="app">
    <div class="wrapper" :class="{'scrollable': show === 20}">
      <opap-slide-list tag="ul" :duration="400" :visible-count="show" force-height>
        <li class="item-container" v-for="(i, index) in length" :key="i" :data-index="index"><span>{{`Item: ${i}`}}</span></li>
      </opap-slide-list>
      <button @click="show = (show === 1 ? 40 : 1)">Toggle</button>
    </div>
  </div>
</template>
<script>
import OpapSlideList from "./components/opap-slide-list";

export default {
  name: 'App',
  data() {
    return {
      length: 40,
      show: 1,
    }
  },
  components: {
    OpapSlideList
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

.wrapper {
  display: flex;
  flex-direction: column;
  place-content: stretch flex-start;
  align-items: stretch;
  min-width: 100px;
  .osl-list-container {
    overflow-y: hidden;
  }
  &.scrollable {
    .osl-list-container {
      overflow-y: auto;
    }
  }
}

.wrapper button {
  margin-top: 10px;
  padding: 5px 10px;
}
</style>
