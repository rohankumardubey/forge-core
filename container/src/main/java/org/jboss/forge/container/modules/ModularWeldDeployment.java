package org.jboss.forge.container.modules;

import java.util.Collections;
import java.util.List;

import org.jboss.forge.container.impl.PerformanceTunedBootstrapConfiguration;
import org.jboss.weld.bootstrap.api.Bootstrap;
import org.jboss.weld.bootstrap.spi.BeanDeploymentArchive;
import org.jboss.weld.bootstrap.spi.BootstrapConfiguration;
import org.jboss.weld.environment.se.discovery.AbstractWeldSEDeployment;
import org.jboss.weld.environment.se.discovery.ImmutableBeanDeploymentArchive;
import org.jboss.weld.resources.spi.ResourceLoader;

public class ModularWeldDeployment extends AbstractWeldSEDeployment
{
   private final BeanDeploymentArchive beanDeploymentArchive;

   public ModularWeldDeployment(Bootstrap bootstrap, ResourceLoader resourceLoader, ModuleScanResult scanResult)
   {
      super(bootstrap);
      getServices().add(BootstrapConfiguration.class, new PerformanceTunedBootstrapConfiguration(resourceLoader));
      this.beanDeploymentArchive = new ImmutableBeanDeploymentArchive("classpath", scanResult.getDiscoveredClasses(),
               bootstrap.parse(scanResult.getDiscoveredResourceUrls()));
      this.beanDeploymentArchive.getServices().add(ResourceLoader.class, resourceLoader);
   }

   @Override
   public List<BeanDeploymentArchive> getBeanDeploymentArchives()
   {
      return Collections.singletonList(beanDeploymentArchive);
   }

   @Override
   public BeanDeploymentArchive loadBeanDeploymentArchive(Class<?> beanClass)
   {
      return beanDeploymentArchive;
   }
}
