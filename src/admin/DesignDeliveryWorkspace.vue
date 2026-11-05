<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';

type Project = { id: string; name: string; area: number; schemeType: string; progress?: number; currentStage?: string };

const props = withDefaults(defineProps<{
  embedded?: boolean;
  projectId: string;
  project?: Project;
  versions: any[];
  packages: any[];
  attachments: any[];
  floorplanAssists: any[];
  busy?: boolean;
}>(), { embedded: false, busy: false });
const emit = defineEmits<{
  openDesign: [];
  openDesignObject: [designId: string];
  openDesignPlans: [];
  createDelivery: [];
  copyProject: [];
  uploadAttachment: [file: File];
  assistFloorplan: [file: File];
}>();

const activeTab = ref<'versions' | 'artifacts' | 'files' | 'packages'>('versions');
const artifacts = [
  { key: 'overview', title: '设备总览图', description: '按空间汇总品牌、型号、数量、点位状态', format: '图纸 / CSV' },
  { key: 'points', title: '智能点位图', description: '坐标、安装面、高度、规则命中与待处理原因', format: '图纸 / CSV' },
  { key: 'lighting', title: '灯光交底图', description: '灯具、障碍物、光效、控制组和回路', format: '图纸 / CSV' },
  { key: 'water', title: '水电交底图', description: '供电、底盒、开孔、安装高度与现场备注', format: '图纸' },
  { key: 'network', title: '网络布线图', description: '弱电箱、交换机、AP、网关和控制链路', format: '图纸 / CSV' },
  { key: 'woodwork', title: '木工交底图', description: '柜体灯带、窗帘盒、检修口与收口条件', format: '图纸' },
];
const versionCount = computed(() => props.versions.length);
const packageCount = computed(() => props.packages.length);
const fileCount = computed(() => props.attachments.length + props.floorplanAssists.length);

const dateTime = (value: string) => value ? new Date(value).toLocaleString('zh-CN') : '—';
const fileSize = (size: number) => size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.ceil(size / 1024))}KB`;
const artifactSize = (size: number) => size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.ceil(size / 1024))}KB`;
const pick = (event: Event, type: 'attachment' | 'floorplan') => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) type === 'attachment' ? emit('uploadAttachment', file) : emit('assistFloorplan', file);
  input.value = '';
};
const openArtifact = (key: string) => {
  if (!props.projectId) return;
  window.open(`/app/?project=${props.projectId}&restore=1&rtab=${key === 'network' ? 'circuit' : 'smart'}`, '_blank', 'noopener');
};
</script>

<template>
  <section class="design-delivery-workspace">
    <div class="panel design-delivery-head">
      <div class="design-delivery-title">
        <div>
          <div class="admin-breadcrumb">客户项目 / {{ project?.name || '当前项目' }} / <strong>设计与交付</strong></div>
          <h3>设计与交付</h3>
          <p>{{ project?.area || 0 }}㎡ · {{ project?.schemeType }} · 设计版本、施工成果、项目文件和交付包统一归档。</p>
        </div>
        <div class="design-delivery-actions">
          <NButton :disabled="!projectId" @click="emit('openDesignPlans')">设计方案列表</NButton>
          <NButton :disabled="!projectId" @click="emit('openDesign')">打开设计工作台</NButton>
        </div>
      </div>
      <div class="design-delivery-stats">
        <span><b>{{ versionCount }}</b> 个设计版本</span>
        <span><b>{{ fileCount }}</b> 个项目文件</span>
        <span><b>{{ packageCount }}</b> 个交付包</span>
        <span><b>{{ project?.progress || 0 }}%</b> 项目进度</span>
      </div>
    </div>

    <div class="admin-tabs design-delivery-tabs">
      <button :class="{active:activeTab==='versions'}" @click="activeTab='versions'">设计版本</button>
      <button :class="{active:activeTab==='artifacts'}" @click="activeTab='artifacts'">施工成果</button>
      <button :class="{active:activeTab==='files'}" @click="activeTab='files'">项目文件</button>
      <button :class="{active:activeTab==='packages'}" @click="activeTab='packages'">交付包</button>
    </div>

    <section v-if="activeTab==='versions'" class="panel">
      <div class="panel-head"><div><span class="panel-kicker">DESIGN VERSIONS</span><h3>设计版本</h3></div><NButton size="small" :disabled="!projectId" @click="emit('copyProject')">复制历史项目</NButton></div>
      <div class="design-table-wrap">
        <table class="design-list-table">
          <thead><tr><th>版本</th><th>版本名称</th><th>方案规模</th><th>规则版本</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="version in versions" :key="version.id">
              <td><span class="design-version-badge">V{{ version.versionNo }}</span></td>
              <td><strong>{{ version.name }}</strong><small><button v-if="version.designId" type="button" class="design-owner-link" @click="emit('openDesignObject', version.designId)">{{ version.designName || version.designId }}</button><template v-else>{{ version.designName || '项目方案' }}</template> · {{ version.id }}</small></td>
              <td><span class="design-summary-cell">家具 {{ version.summary.furniture }} · 设备 {{ version.summary.devices }} · 已布置 {{ version.summary.placed }} · 待处理 {{ version.summary.pending }} · 回路 {{ version.summary.circuits }}</span></td>
              <td>{{ version.ruleVersion }}</td>
              <td><NTag size="small" :bordered="false">{{ version.status }}</NTag></td>
              <td>{{ dateTime(version.createdAt) }}</td>
              <td><div class="table-actions"><button v-if="version.designId" class="table-link" @click="emit('openDesignObject', version.designId)">方案详情</button><button class="table-link" @click="emit('openDesign')">打开设计</button></div></td>
            </tr>
            <tr v-if="!versions.length"><td colspan="7"><div class="empty">还没有设计版本。进入设计工作台后保存第一个项目版本。</div></td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else-if="activeTab==='artifacts'" class="panel">
      <div class="panel-head"><div><span class="panel-kicker">DESIGN ARTIFACTS</span><h3>施工成果</h3></div><span class="panel-note">图表口径与当前设计版本保持一致</span></div>
      <div class="design-table-wrap">
        <table class="design-list-table artifacts-table">
          <thead><tr><th>成果</th><th>包含内容</th><th>输出格式</th><th>当前口径</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="artifact in artifacts" :key="artifact.key">
              <td><strong>{{ artifact.title }}</strong><small>{{ artifact.key }}</small></td>
              <td>{{ artifact.description }}</td><td>{{ artifact.format }}</td>
              <td><NTag size="small" :type="versions.length ? 'success' : 'default'" :bordered="false">{{ versions.length ? '可基于已存版本查看' : '等待设计版本' }}</NTag></td>
              <td><button class="table-link" :disabled="!versions.length" @click="openArtifact(artifact.key)">打开成果</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-else-if="activeTab==='files'" class="design-file-grid">
      <section class="panel">
        <div class="panel-head"><div><span class="panel-kicker">PROJECT FILES</span><h3>户型图、合同与现场照片</h3></div><label class="secondary link-button file-button">上传附件<input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" @change="pick($event,'attachment')"></label></div>
        <div class="design-table-wrap">
          <table class="design-list-table"><thead><tr><th>文件</th><th>分类</th><th>大小</th><th>上传时间</th><th>操作</th></tr></thead><tbody>
            <tr v-for="item in attachments" :key="item.id"><td><strong>{{ item.name }}</strong><small>{{ item.id }}</small></td><td>{{ item.category }}</td><td>{{ fileSize(item.size) }}</td><td>{{ dateTime(item.createdAt) }}</td><td><a class="table-link" :href="item.url" target="_blank" rel="noopener">查看</a></td></tr>
            <tr v-if="!attachments.length"><td colspan="5"><div class="empty">还没有项目附件。</div></td></tr>
          </tbody></table>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><div><span class="panel-kicker">FLOORPLAN ASSIST</span><h3>本地户型辅助识别</h3></div><label class="secondary link-button file-button">选择户型图<input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" @change="pick($event,'floorplan')"></label></div>
        <div class="design-table-wrap">
          <table class="design-list-table"><thead><tr><th>文件</th><th>识别结果</th><th>置信度</th><th>状态</th><th>操作</th></tr></thead><tbody>
            <tr v-for="item in floorplanAssists" :key="item.id"><td><strong>{{ item.fileName }}</strong><small>{{ dateTime(item.createdAt) }} · {{ item.method }}</small></td><td>{{ item.rooms.map((room:any)=>room.name).join('、') }}</td><td>{{ Math.round(item.confidence*100) }}%</td><td><NTag size="small" type="warning" :bordered="false">{{ item.status }}</NTag></td><td><a class="table-link" :href="`/app/space.html?space=ALL&project=${projectId}`">打开复核</a></td></tr>
            <tr v-if="!floorplanAssists.length"><td colspan="5"><div class="empty">尚未生成候选空间。</div></td></tr>
          </tbody></table>
        </div>
        <p class="design-panel-hint">候选结果必须进入工作台人工框选并校准比例尺。</p>
      </section>
    </div>

    <section v-else class="panel">
      <div class="panel-head"><div><span class="panel-kicker">DELIVERY PACKAGES</span><h3>交付包</h3></div><NButton type="primary" size="small" :disabled="!versions.length" :loading="busy" @click="emit('createDelivery')">生成施工交付包</NButton></div>
      <div class="design-table-wrap">
        <table class="design-list-table">
          <thead><tr><th>交付包</th><th>可下载成果</th><th>状态</th><th>生成时间</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in packages" :key="item.id">
              <td><strong>{{ item.name }}</strong><small>{{ item.id }}</small></td>
              <td>{{ item.manifest.artifacts.filter((artifact:any)=>artifact.status==='已生成' && artifact.size>0).length }} 类文件</td>
              <td><NTag size="small" :type="item.status==='已生成'?'success':'default'" :bordered="false">{{ item.status }}</NTag></td>
              <td>{{ dateTime(item.createdAt) }}</td>
              <td><a class="table-link" :href="`/api/admin/delivery-packages/${item.id}/download`">下载整包</a></td>
            </tr>
            <tr v-if="!packages.length"><td colspan="5"><div class="empty">保存设计版本后可生成离线交付包。</div></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
